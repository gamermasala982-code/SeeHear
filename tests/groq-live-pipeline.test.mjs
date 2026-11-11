import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PRIMARY_CANDIDATE_MODEL,
  resolveAccessibleGroqModel,
  clearModelCache,
} from '../server/groqClient.js';
import explainHandler from '../api/explain.js';
import askHandler from '../api/ask.js';
import { SAMPLE_DOCUMENTS } from '../src/data/mockData.js';

if (fs.existsSync('.env')) {
  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim();
    }
  }
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function createMockGroqFetch({ models = ['openai/gpt-oss-20b', 'qwen/qwen3-32b'], onChat }) {
  return async (url, options = {}) => {
    const urlStr = String(url);
    if (urlStr.endsWith('/models')) {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            data: models.map((id) => ({ id, active: true })),
          };
        },
      };
    }
    if (urlStr.endsWith('/chat/completions')) {
      const parsedBody = JSON.parse(options.body || '{}');
      return onChat(parsedBody, options);
    }
    throw new Error('Unexpected fetch URL: ' + urlStr);
  };
}

test('Test 1 & 2 — Retired llama-3.1-8b-instant is completely removed and model is selected from /openai/v1/models (defaulting to openai/gpt-oss-20b)', async () => {
  clearModelCache();
  assert.equal(PRIMARY_CANDIDATE_MODEL, 'openai/gpt-oss-20b');

  // Verify no active source file contains the retired default
  const filesToCheck = [
    'server/groqClient.js',
    'api/explain.js',
    'api/ask.js',
    'api/v1/ai/explain.js',
    'api/v1/ai/ask.js',
  ];
  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, 'utf8');
    assert.equal(
      content.includes('llama-3.1-8b-instant'),
      false,
      `Expected ${file} not to contain retired llama-3.1-8b-instant`
    );
  }

  const mockFetch = createMockGroqFetch({
    models: ['whisper-large-v3', 'openai/gpt-oss-20b', 'qwen/qwen3-32b'],
    onChat: async () => ({ ok: true, status: 200, async json() { return {}; } }),
  });

  const resolved = await resolveAccessibleGroqModel({
    apiKey: 'test_key_models',
    fetchImpl: mockFetch,
    forceRefresh: true,
  });
  assert.equal(resolved.ok, true);
  assert.equal(resolved.modelId, 'openai/gpt-oss-20b');
});

test('Test 3 — Valid Groq response is parsed and returned with model metadata and citations', async () => {
  clearModelCache();
  const origFetch = globalThis.fetch;
  const origKey = "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";
  "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" = 'test_valid_key';

  globalThis.fetch = createMockGroqFetch({
    models: ['openai/gpt-oss-20b'],
    onChat: async (body) => ({
      ok: true,
      status: 200,
      async json() {
        return {
          model: body.model,
          choices: [
            {
              finish_reason: 'stop',
              message: {
                content:
                  'Article 21 protects life and personal liberty [Constitutional Foundations, Page 2, Section 1.1].',
              },
            },
          ],
        };
      },
    }),
  });

  try {
    const res = createMockRes();
    await askHandler(
      {
        method: 'POST',
        body: {
          question: 'Explain Article 21 in simple language and cite the source passage.',
          documents: [SAMPLE_DOCUMENTS[0]],
          language: 'en',
        },
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.model, 'openai/gpt-oss-20b');
    assert.match(res.body.answer, /Article 21/);
    assert.ok(res.body.citations.length > 0);
  } finally {
    globalThis.fetch = origFetch;
    "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" = origKey;
  }
});

test('Test 4 & 5 — Provider model errors, missing keys, and 401 invalid credentials become honest API errors, never fake answers', async () => {
  clearModelCache();
  const origFetch = globalThis.fetch;
  const origKey = "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";

  try {
    // Missing key
    delete "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";
    const resMissing = createMockRes();
    await askHandler(
      { method: 'POST', body: { question: 'What is Article 21?', documents: [SAMPLE_DOCUMENTS[0]] } },
      resMissing
    );
    assert.equal(resMissing.statusCode, 503);
    assert.equal(resMissing.body.code, 'MISSING_GROQ_API_KEY');
    assert.equal(resMissing.body.answer, undefined);

    // Invalid key (401)
    "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" = 'invalid_key';
    globalThis.fetch = async () => ({
      ok: false,
      status: 401,
      async json() {
        return { error: { message: 'Invalid API Key' } };
      },
    });

    const res401 = createMockRes();
    await askHandler(
      { method: 'POST', body: { question: 'What is Article 21?', documents: [SAMPLE_DOCUMENTS[0]] } },
      res401
    );
    assert.equal(res401.statusCode, 401);
    assert.equal(res401.body.code, 'INVALID_GROQ_API_KEY');
    assert.equal(res401.body.answer, undefined);
  } finally {
    globalThis.fetch = origFetch;
    "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" = origKey;
  }
});

test('Test 6, 7 & 8 — Different questions and document selections change retrieval scope and cite real retrieved passages', async () => {
  clearModelCache();
  const origFetch = globalThis.fetch;
  const origKey = "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";
  "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" = 'test_rag_key';

  const capturedChatPayloads = [];
  globalThis.fetch = createMockGroqFetch({
    models: ['openai/gpt-oss-20b'],
    onChat: async (body) => {
      capturedChatPayloads.push(body);
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            model: body.model,
            choices: [
              {
                finish_reason: 'stop',
                message: { content: 'Grounded answer for: ' + body.messages[1].content.slice(-80) },
              },
            ],
          };
        },
      };
    },
  });

  try {
    // Query 1: Maneka Gandhi on Constitutional doc (should rank Section 2.4 Page 7 first!)
    const res1 = createMockRes();
    await askHandler(
      {
        method: 'POST',
        body: {
          question: 'What is the difference between A.K. Gopalan and Maneka Gandhi interpretations of Article 21?',
          documents: [SAMPLE_DOCUMENTS[0]],
          language: 'en',
        },
      },
      res1
    );

    // Query 2: Bellman-Ford on Algorithms doc
    const res2 = createMockRes();
    await askHandler(
      {
        method: 'POST',
        body: {
          question: 'Why does Dijkstra fail on negative edge weights while Bellman-Ford succeeds?',
          documents: [SAMPLE_DOCUMENTS[2]],
          language: 'en',
        },
      },
      res2
    );

    assert.equal(capturedChatPayloads.length, 2);
    assert.notEqual(capturedChatPayloads[0].messages[1].content, capturedChatPayloads[1].messages[1].content);
    assert.match(capturedChatPayloads[0].messages[1].content, /Maneka Gandhi/);
    assert.match(capturedChatPayloads[1].messages[1].content, /Bellman-Ford/);

    // Verify citations refer to actual retrieved sections
    assert.equal(res1.body.citations[0].docId, 'doc-constitution');
    assert.match(res1.body.citations[0].reference, /Page 7, Section 2.4/);
    assert.equal(res2.body.citations[0].docId, 'doc-algorithms');
    assert.match(res2.body.citations[0].reference, /Page 6, Section 3.4/);
  } finally {
    globalThis.fetch = origFetch;
    "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" = origKey;
  }
});

test('Test 9 & 10 — Hindi, Hinglish, and English settings reach the model and truncated responses are caught', async () => {
  clearModelCache();
  const origFetch = globalThis.fetch;
  const origKey = "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";
  "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" = 'test_lang_key';

  const seenSystemPrompts = [];
  globalThis.fetch = createMockGroqFetch({
    models: ['openai/gpt-oss-20b'],
    onChat: async (body) => {
      seenSystemPrompts.push(body.messages[0].content);
      const isHi = body.messages[0].content.includes('DEVANAGARI');
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            model: body.model,
            choices: [
              {
                finish_reason: 'stop',
                message: {
                  content: isHi
                    ? 'अनुच्छेद 21 के अनुसार किसी भी व्यक्ति को उसके प्राण या दैहिक स्वतंत्रता से विधि द्वारा स्थापित प्रक्रिया के अनुसार ही वंचित किया जाएगा।'
                    : 'Is passage mein Article 21 aur personal liberty ko explain kiya gaya hai.',
                },
              },
            ],
          };
        },
      };
    },
  });

  try {
    const resHi = createMockRes();
    await askHandler(
      {
        method: 'POST',
        body: { question: 'Explain Article 21', documents: [SAMPLE_DOCUMENTS[0]], language: 'hi' },
      },
      resHi
    );
    assert.equal(resHi.statusCode, 200);
    assert.match(resHi.body.answer, /अनुच्छेद 21/);
    assert.match(seenSystemPrompts[0], /DEVANAGARI/);

    // Now simulate persistent truncation
    globalThis.fetch = createMockGroqFetch({
      models: ['openai/gpt-oss-20b'],
      onChat: async (body) => ({
        ok: true,
        status: 200,
        async json() {
          return {
            model: body.model,
            choices: [{ finish_reason: 'length', message: { content: 'Truncated partial text...' } }],
          };
        },
      }),
    });

    const resTrunc = createMockRes();
    await askHandler(
      {
        method: 'POST',
        body: { question: 'Explain Article 21', documents: [SAMPLE_DOCUMENTS[0]], language: 'en' },
      },
      resTrunc
    );
    assert.equal(resTrunc.statusCode, 502);
    assert.equal(resTrunc.body.code, 'TRUNCATED_RESPONSE');
    assert.equal(resTrunc.body.incomplete, true);
  } finally {
    globalThis.fetch = origFetch;
    "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" = origKey;
  }
});

test('Test 11, 12, 13 & 14 — Stale race guards exist in both UI components and no API secrets exist in src/', () => {
  const qaSource = fs.readFileSync('src/components/CrossSourceQA.jsx', 'utf8');
  const expSource = fs.readFileSync('src/components/ExplanationPanel.jsx', 'utf8');

  assert.match(qaSource, /activeRequestIdRef/);
  assert.match(qaSource, /thisRequestId !== activeRequestIdRef.current/);
  assert.match(expSource, /activeRequestIdRef/);
  assert.match(expSource, /regenerateNonce/);

  // Ensure no gsk_ secret appears in any frontend or backend source file
  const checkFiles = [
    'src/App.jsx',
    'src/components/CrossSourceQA.jsx',
    'src/components/ExplanationPanel.jsx',
    'src/components/DocumentReader.jsx',
    'server/groqClient.js',
    'api/explain.js',
    'api/ask.js',
  ];
  for (const f of checkFiles) {
    const src = fs.readFileSync(f, 'utf8');
    assert.equal(/gsk_[A-Za-z0-9]{20,}/.test(src), false, `Found hardcoded gsk_ key in ${f}`);
  }
});

test('Test 15 — Live Groq Models & RAG + Explain Verification (executes when GROQ_API_KEY is present in .env)', async (t) => {
  if (!"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" || "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".startsWith('test_')) {
    t.skip('No live GROQ_API_KEY in environment; skipping live Groq verification.');
    return;
  }

  clearModelCache();
  const modelInfo = await resolveAccessibleGroqModel({
    apiKey: "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",
    forceRefresh: true,
  });
  assert.equal(modelInfo.ok, true, 'Live /openai/v1/models check failed: ' + modelInfo.message);
  console.log('✓ Verified accessible Groq model for this API key:', modelInfo.modelId);

  // Live Acceptance Test B/C: Ask Across Sources on Constitutional Foundations
  const resAsk = createMockRes();
  await askHandler(
    {
      method: 'POST',
      body: {
        question: 'Explain Article 21 in simple language and cite the source passage.',
        documents: [SAMPLE_DOCUMENTS[0]],
        language: 'en',
      },
    },
    resAsk
  );
  assert.equal(resAsk.statusCode, 200, 'Live /api/ask failed: ' + JSON.stringify(resAsk.body));
  assert.equal(resAsk.body.success, true);
  assert.ok(resAsk.body.answer.length > 60);
  assert.equal(resAsk.body.citations[0].docId, 'doc-constitution');

  // Live Acceptance Test F: Hindi output on Understand
  const resExplainHi = createMockRes();
  await explainHandler(
    {
      method: 'POST',
      body: {
        documentId: 'doc-constitution',
        documentTitle: SAMPLE_DOCUMENTS[0].title,
        pageRef: SAMPLE_DOCUMENTS[0].sections[0].pageRef,
        text: SAMPLE_DOCUMENTS[0].sections[0].originalText,
        style: 'simple',
        language: 'hi',
      },
    },
    resExplainHi
  );
  assert.equal(resExplainHi.statusCode, 200, 'Live /api/explain (Hindi) failed: ' + JSON.stringify(resExplainHi.body));
  assert.match(resExplainHi.body.explanation, /[\u0900-\u097F]/);
});
