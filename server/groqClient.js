const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const PRIMARY_CANDIDATE_MODEL = 'openai/gpt-oss-20b';

// Priority order when selecting from the authenticated account's GET /openai/v1/models response
export const PREFERRED_MODEL_ORDER = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'qwen/qwen3-32b',
  'deepseek-r1-distill-llama-70b',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

const NON_TEXT_CHAT_PATTERNS = [
  /whisper/i,
  /tts/i,
  /playai/i,
  /guard/i,
  /safeguard/i,
  /embed/i,
  /moderation/i,
  /orpheus/i,
];

let cachedModelInfo = {
  modelId: null,
  availableModels: [],
  expiresAt: 0,
  keyFingerprint: null,
};

export function clearModelCache() {
  cachedModelInfo = {
    modelId: null,
    availableModels: [],
    expiresAt: 0,
    keyFingerprint: null,
  };
}

export function isChatTextModel(modelId) {
  if (!modelId || typeof modelId !== 'string') return false;
  return !NON_TEXT_CHAT_PATTERNS.some((re) => re.test(modelId));
}

export async function resolveAccessibleGroqModel({ apiKey, fetchImpl = globalThis.fetch, forceRefresh = false }) {
  const configuredOverride = process.env.GROQ_MODEL ? process.env.GROQ_MODEL.trim() : '';
  const keyFp = apiKey ? apiKey.slice(0, 8) + ':' + apiKey.length : '';
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedModelInfo.modelId &&
    cachedModelInfo.keyFingerprint === keyFp &&
    cachedModelInfo.expiresAt > now
  ) {
    return {
      ok: true,
      modelId: cachedModelInfo.modelId,
      availableModels: cachedModelInfo.availableModels,
      fromCache: true,
    };
  }

  try {
    const res = await fetchImpl(`${GROQ_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    let payload = null;
    try {
      payload = await res.json();
    } catch {
      return {
        ok: false,
        status: 502,
        code: 'MALFORMED_MODELS_RESPONSE',
        message: 'Groq /openai/v1/models returned invalid JSON.',
      };
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          status: 401,
          code: 'INVALID_GROQ_API_KEY',
          message: 'Groq authentication failed (HTTP ' + res.status + '). Verify that GROQ_API_KEY is valid.',
        };
      }
      if (res.status === 429) {
        return {
          ok: false,
          status: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Groq rate limit exceeded while checking available models.',
        };
      }
      return {
        ok: false,
        status: 502,
        code: 'MODELS_LOOKUP_FAILED',
        message: payload?.error?.message || `Failed to list Groq models (HTTP ${res.status}).`,
      };
    }

    const rawList = Array.isArray(payload?.data) ? payload.data : [];
    const activeIds = rawList
      .filter((m) => m && typeof m.id === 'string' && m.active !== false && isChatTextModel(m.id))
      .map((m) => m.id);

    if (activeIds.length === 0) {
      return {
        ok: false,
        status: 503,
        code: 'NO_ACCESSIBLE_GROQ_MODELS',
        message: 'Your Groq API key succeeded, but no active text-generation models were returned for this account.',
      };
    }

    let chosen = null;

    // 1. If GROQ_MODEL env var is explicitly set AND accessible on the account, honor it
    if (configuredOverride && activeIds.includes(configuredOverride)) {
      chosen = configuredOverride;
    }

    // 2. Otherwise prefer 'openai/gpt-oss-20b' or next preferred candidate in PREFERRED_MODEL_ORDER
    if (!chosen) {
      for (const candidate of PREFERRED_MODEL_ORDER) {
        if (activeIds.includes(candidate)) {
          chosen = candidate;
          break;
        }
      }
    }

    // 3. Otherwise select the first active chat/text model returned by the API
    if (!chosen) {
      chosen = activeIds[0];
    }

    cachedModelInfo = {
      modelId: chosen,
      availableModels: activeIds,
      expiresAt: now + 5 * 60 * 1000,
      keyFingerprint: keyFp,
    };

    return {
      ok: true,
      modelId: chosen,
      availableModels: activeIds,
      fromCache: false,
    };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      code: 'GROQ_NETWORK_FAILURE',
      message: 'Unable to reach Groq Models API: ' + (err?.message || String(err)),
    };
  }
}

export function countDevanagariChars(str) {
  const m = String(str || '').match(/[\u0900-\u097F]/g);
  return m ? m.length : 0;
}

export function countLatinLetters(str) {
  const m = String(str || '').match(/[A-Za-z]/g);
  return m ? m.length : 0;
}

export function isHindiComplianceFailure(outputText) {
  const devCount = countDevanagariChars(outputText);
  const latinCount = countLatinLetters(outputText);
  if (devCount < 25) return true;
  if (latinCount > devCount * 2.2) return true;
  return false;
}

export function stripReasoningArtifacts(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export async function executeGroqChatCompletion({
  apiKey,
  messages,
  maxTokens = 1500,
  temperature = 0.25,
  fetchImpl = globalThis.fetch,
}) {
  const modelResolution = await resolveAccessibleGroqModel({ apiKey, fetchImpl });
  if (!modelResolution.ok) {
    return modelResolution;
  }

  const candidateModels = [
    modelResolution.modelId,
    ...modelResolution.availableModels.filter((m) => m !== modelResolution.modelId),
  ].slice(0, 3);

  let lastFailure = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    try {
      const response = await fetchImpl(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        clearTimeout(timeoutId);
        return {
          ok: false,
          status: 502,
          code: 'MALFORMED_PROVIDER_RESPONSE',
          message: 'Groq returned a non-JSON chat completion payload.',
        };
      }

      if (!response.ok) {
        const providerMsg = data?.error?.message || `HTTP ${response.status}`;
        const providerCode = data?.error?.code || '';

        if (response.status === 401) {
          clearTimeout(timeoutId);
          return {
            ok: false,
            status: 401,
            code: 'INVALID_GROQ_API_KEY',
            message: 'Groq authentication failed. Check GROQ_API_KEY in your server environment.',
          };
        }

        if (response.status === 429) {
          clearTimeout(timeoutId);
          return {
            ok: false,
            status: 429,
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Groq rate limit or quota exceeded. Please wait a moment and try again.',
          };
        }

        // If this specific model was rejected (decommissioned, no access, or doesn't support chat), try next verified model
        const isModelAccessIssue =
          response.status === 400 ||
          response.status === 403 ||
          response.status === 404 ||
          providerCode === 'model_not_found' ||
          providerCode === 'model_decommissioned' ||
          /model.*does not exist|do not have access|decommissioned|not supported/i.test(providerMsg);

        if (isModelAccessIssue && i < candidateModels.length - 1) {
          lastFailure = {
            ok: false,
            status: 400,
            code: 'INACCESSIBLE_OR_DEPRECATED_MODEL',
            message: `Groq model "${model}" rejected: ${providerMsg}`,
          };
          clearTimeout(timeoutId);
          continue;
        }

        clearTimeout(timeoutId);
        return {
          ok: false,
          status: isModelAccessIssue ? 400 : 502,
          code: isModelAccessIssue ? 'INACCESSIBLE_OR_DEPRECATED_MODEL' : 'GROQ_PROVIDER_ERROR',
          message: `Groq error (${model}): ${providerMsg}`,
        };
      }

      const choice = data?.choices?.[0];
      const rawContent = choice?.message?.content ? String(choice.message.content) : '';
      const cleanedContent = stripReasoningArtifacts(rawContent);
      const finishReason = choice?.finish_reason || 'stop';

      clearTimeout(timeoutId);

      if (!cleanedContent) {
        return {
          ok: false,
          status: 502,
          code: 'EMPTY_MODEL_RESPONSE',
          message: 'Groq returned an empty response.',
        };
      }

      // Cache working model ID
      cachedModelInfo.modelId = model;

      return {
        ok: true,
        content: cleanedContent,
        finishReason,
        modelUsed: data?.model || model,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        return {
          ok: false,
          status: 504,
          code: 'GROQ_TIMEOUT',
          message: 'Groq request timed out after 28 seconds.',
        };
      }
      lastFailure = {
        ok: false,
        status: 502,
        code: 'GROQ_NETWORK_FAILURE',
        message: 'Network failure contacting Groq API: ' + (err?.message || String(err)),
      };
    }
  }

  return (
    lastFailure || {
      ok: false,
      status: 502,
      code: 'GROQ_PROVIDER_ERROR',
      message: 'All candidate Groq models failed.',
    }
  );
}
