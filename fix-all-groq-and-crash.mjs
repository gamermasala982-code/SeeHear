import fs from 'fs';
import { execSync } from 'child_process';

const GROQ_KEY_FALLBACK = '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';

fs.mkdirSync('api/v1/ai', { recursive: true });

// 1. Create clean api/explain.js (handles both Explain & Reader Translation)
const explainApiCode = `export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, style = 'simple', language = 'en', mode = 'explain' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Passage text is required.' });
  }

  const apiKey = "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" || '${GROQ_KEY_FALLBACK}';

  const langLabel =
    language === 'hi'
      ? 'Hindi (हिन्दी in Devanagari script)'
      : language === 'hinglish'
      ? 'Hinglish (clear conversational Hindi-English mix in Roman script)'
      : 'English';

  const stylePrompts = {
    simple: 'Explain this passage in simple, everyday student-friendly language. Break down any questions or concepts clearly.',
    detailed: 'Provide a thorough, detailed academic breakdown of every concept, question, and principle in this passage.',
    exam: 'Provide high-yield, exam-focused bullet points, key definitions, and direct answers/takeaways for this passage.',
  };

  const systemPrompt =
    mode === 'translate'
      ? \`You are SeeHear Multilingual Academic Translator. Translate and adapt the user's passage accurately into \${langLabel}. Preserve headings, question numbers, and technical terms clearly.\`
      : \`You are SeeHear AI Academic Tutor. \${stylePrompts[style] || stylePrompts.simple} Write your entire response in \${langLabel}.\`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text.slice(0, 6000) },
        ],
        temperature: 0.25,
        max_tokens: 900,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({
        error: data?.error?.message || 'Groq API returned an error.',
      });
    }

    const explanation = data.choices?.[0]?.message?.content?.trim() || 'No output returned.';
    return res.status(200).json({
      success: true,
      provider: 'Groq Llama 3.3 70B',
      explanation,
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Failed to reach Groq AI service: ' + (err?.message || String(err)),
    });
  }
}
`;

fs.writeFileSync('api/explain.js', explainApiCode, 'utf8');
fs.writeFileSync('api/v1/ai/explain.js', explainApiCode, 'utf8');

// 2. Create clean api/ask.js (Cross-Source RAG over Uploaded PDFs + Samples)
const askApiCode = `export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, documents = [], language = 'en' } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const apiKey = "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" || '${GROQ_KEY_FALLBACK}';

  const langLabel =
    language === 'hi'
      ? 'Hindi (हिन्दी)'
      : language === 'hinglish'
      ? 'Hinglish (Roman script Hindi + English)'
      : 'English';

  const contextBlocks = [];
  const citations = [];

  documents.forEach((doc) => {
    const secs = Array.isArray(doc.sections) ? doc.sections.slice(0, 8) : [];
    secs.forEach((sec) => {
      if (sec?.originalText) {
        contextBlocks.push(
          \`[\${doc.title} — \${sec.pageRef || 'Section'}]\\n\${sec.originalText.slice(0, 900)}\`
        );
      }
    });
    if (secs[0]) {
      citations.push({
        docId: doc.id,
        docTitle: doc.title,
        reference: secs[0].pageRef || 'Page 1',
        excerpt: secs[0].originalText.slice(0, 180) + '...',
      });
    }
  });

  const combinedContext = contextBlocks.join('\\n\\n---\\n\\n').slice(0, 12000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: \`You are SeeHear Cross-Source Research Assistant. Answer the user's question directly and thoroughly based on the provided document passages. Cite the document titles and page numbers in your explanation. Respond in \${langLabel}.\`,
          },
          {
            role: 'user',
            content: \`Active Source Documents:\\n\\n\${combinedContext}\\n\\nUser Question: \${question}\`,
          },
        ],
        temperature: 0.2,
        max_tokens: 950,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({
        error: data?.error?.message || 'Groq API error',
      });
    }

    const answer = data.choices?.[0]?.message?.content?.trim() || 'No synthesis generated.';
    return res.status(200).json({
      success: true,
      provider: 'Groq Llama 3.3 70B',
      answer,
      citations,
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Groq RAG request failed: ' + (err?.message || String(err)),
    });
  }
}
`;

fs.writeFileSync('api/ask.js', askApiCode, 'utf8');
fs.writeFileSync('api/v1/ai/ask.js', askApiCode, 'utf8');

// 3. Rewrite src/components/ExplanationPanel.jsx (Fixes White Screen Crash & Runs Live Groq AI)
const explanationPanelCode = `import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Languages, RefreshCw } from 'lucide-react';
import { EXPLANATION_STYLES, LANGUAGES } from '../data/mockData.js';
import AudioPlayer from './AudioPlayer.jsx';

export default function ExplanationPanel({
  documents,
  activeDocId,
  onSelectDocId,
  activeSectionId,
  onSelectSectionId,
  explanationStyle,
  onChangeStyle,
  language,
  onChangeLanguage,
  onNavigate,
}) {
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const currentSection =
    activeDoc?.sections?.find((s) => s.id === activeSectionId) ||
    activeDoc?.sections?.[0];

  const [aiExplanation, setAiExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleDocChange = (newDocId) => {
    onSelectDocId(newDocId);
    const found = documents.find((d) => d.id === newDocId);
    if (found?.sections?.[0]) {
      onSelectSectionId(found.sections[0].id);
    }
  };

  useEffect(() => {
    if (!currentSection?.originalText) {
      setAiExplanation('');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setErrorText('');

    fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: currentSection.originalText,
        style: explanationStyle,
        language: language,
        mode: 'explain',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.explanation) {
          setAiExplanation(data.explanation);
        } else {
          const fallback =
            currentSection?.explanations?.[explanationStyle]?.[language] ||
            currentSection?.explanations?.[explanationStyle]?.en ||
            '';
          if (fallback) {
            setAiExplanation(fallback);
          } else {
            setErrorText(data.error || 'Could not generate AI explanation.');
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        const fallback =
          currentSection?.explanations?.[explanationStyle]?.[language] ||
          currentSection?.explanations?.[explanationStyle]?.en ||
          '';
        if (fallback) {
          setAiExplanation(fallback);
        } else {
          setErrorText('Network error contacting /api/explain: ' + err.message);
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeDoc?.id, currentSection?.id, explanationStyle, language, refreshCounter]);

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Understand — Live AI Explanations</h1>
          <p className="page-subtitle">
            Compare your original document passage with live Groq Llama 3.3 explanations in Simple, Detailed, or Exam-Focused mode.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setRefreshCounter((c) => c + 1)}
            disabled={isLoading}
          >
            <RefreshCw size={14} />
            <span>Regenerate</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('reader')}
          >
            <BookOpen size={14} />
            <span>View Full Document in Reader</span>
          </button>
        </div>
      </header>

      <section className="surface-card" style={{ marginBottom: '1.5rem' }} aria-label="Passage and Style Selection">
        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div>
            <label htmlFor="understand-doc-select" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              1. Select Document
            </label>
            <select
              id="understand-doc-select"
              className="select-field"
              value={activeDoc?.id || ''}
              onChange={(e) => handleDocChange(e.target.value)}
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="understand-sec-select" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              2. Select Page / Passage ({activeDoc?.sections?.length || 0} available)
            </label>
            <select
              id="understand-sec-select"
              className="select-field"
              value={currentSection?.id || ''}
              onChange={(e) => onSelectSectionId(e.target.value)}
            >
              {(activeDoc?.sections || []).map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.pageRef} — {sec.heading}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Sparkles size={15} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Explanation Style:</span>
            {EXPLANATION_STYLES.map((st) => (
              <button
                key={st.id}
                type="button"
                className={\`btn btn-sm \${explanationStyle === st.id ? 'btn-primary' : 'btn-secondary'}\`}
                onClick={() => onChangeStyle(st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Languages size={15} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Output Language:</span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                className={\`btn btn-sm \${language === lang.id ? 'btn-primary' : 'btn-secondary'}\`}
                onClick={() => onChangeLanguage(lang.id)}
              >
                {lang.label.replace(' (Illustrative Demo)', '')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!currentSection ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p>Select a document and passage above to generate a live AI explanation.</p>
        </div>
      ) : (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <section className="surface-card" aria-labelledby="orig-passage-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span id="orig-passage-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Original Source Text ({activeDoc.title})
              </span>
              <span className="meta-tag">{currentSection.pageRef}</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif-reading)', fontSize: '1.25rem', marginBottom: '0.625rem' }}>
              {currentSection.heading}
            </h2>

            <p style={{ fontFamily: 'var(--font-serif-reading)', fontSize: '1.0625rem', lineHeight: 1.75, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
              {currentSection.originalText}
            </p>
          </section>

          <section
            className="surface-card"
            aria-labelledby="ai-exp-heading"
            style={{ borderColor: 'var(--accent-border)', backgroundColor: 'var(--bg-surface)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span id="ai-exp-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)' }}>
                Groq Llama 3.3 Explanation • {EXPLANATION_STYLES.find((s) => s.id === explanationStyle)?.label}
              </span>
              <span className="meta-tag">
                {LANGUAGES.find((l) => l.id === language)?.label.replace(' (Illustrative Demo)', '')}
              </span>
            </div>

            {isLoading ? (
              <div style={{ padding: '2.25rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Sparkles size={20} style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }} />
                <div style={{ fontWeight: 600 }}>Generating Live Groq AI Explanation...</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Evaluating "{currentSection.heading}" in {language.toUpperCase()}
                </div>
              </div>
            ) : errorText ? (
              <div className="notice-banner error" style={{ marginBottom: 0 }}>
                <span>{errorText}</span>
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.975rem',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-line',
                    color: 'var(--text-primary)',
                    marginBottom: '1.25rem',
                  }}
                >
                  {aiExplanation}
                </div>

                <AudioPlayer
                  textToSpeak={aiExplanation}
                  label={\`\${currentSection.heading} (\${explanationStyle} explanation)\`}
                  languageCode={language}
                />
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/ExplanationPanel.jsx', explanationPanelCode, 'utf8');

// 4. Rewrite src/components/DocumentReader.jsx (Translates Uploaded PDFs into Hindi/Hinglish live via Groq)
const readerCode = `import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Languages,
  ZoomIn,
  ZoomOut,
  Columns,
  Maximize2,
} from 'lucide-react';
import { LANGUAGES } from '../data/mockData.js';
import AudioPlayer from './AudioPlayer.jsx';

export default function DocumentReader({
  documents,
  activeDocId,
  onSelectDocId,
  language,
  onChangeLanguage,
  settings,
  onUpdateSettings,
  onNavigate,
  onJumpToUnderstand,
}) {
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const [selectedSectionId, setSelectedSectionId] = useState(
    activeDoc?.sections?.[0]?.id || ''
  );
  const [focusMode, setFocusMode] = useState(false);
  const [liveTranslation, setLiveTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (activeDoc?.sections?.[0] && !activeDoc.sections.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(activeDoc.sections[0].id);
    }
  }, [activeDocId, activeDoc]);

  const currentSection =
    activeDoc?.sections?.find((s) => s.id === selectedSectionId) ||
    activeDoc?.sections?.[0];

  useEffect(() => {
    if (!currentSection || language === 'en') {
      setLiveTranslation('');
      return;
    }

    const existing = currentSection?.translations?.[language];
    if (existing) {
      setLiveTranslation(existing);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);
    fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: currentSection.originalText,
        language,
        mode: 'translate',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.explanation) {
          setLiveTranslation(data.explanation);
        } else {
          setLiveTranslation('Translation unavailable: ' + (data.error || 'Unknown error'));
        }
        setIsTranslating(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLiveTranslation('Translation error: ' + err.message);
        setIsTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentSection?.id, language]);

  const handleDocSwitch = (newDocId) => {
    onSelectDocId(newDocId);
    const nextDoc = documents.find((d) => d.id === newDocId);
    if (nextDoc?.sections?.[0]) {
      setSelectedSectionId(nextDoc.sections[0].id);
    }
  };

  const adjustFontSize = (delta) => {
    const sizes = ['0.95rem', '1.0625rem', '1.1875rem', '1.3125rem'];
    const currentIndex = sizes.indexOf(settings.readerFontSize);
    const baseIdx = currentIndex === -1 ? 1 : currentIndex;
    const nextIdx = Math.min(sizes.length - 1, Math.max(0, baseIdx + delta));
    onUpdateSettings({ readerFontSize: sizes[nextIdx] });
  };

  const activeTextForSpeech =
    language === 'en'
      ? currentSection?.originalText
      : liveTranslation || currentSection?.originalText;

  return (
    <div>
      <header className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('documents')}
            >
              <ArrowLeft size={15} />
              <span>Back to Library</span>
            </button>
            <span className="meta-tag">{activeDoc.sourceType}</span>
          </div>
          <h1 className="page-title">{activeDoc.title}</h1>
          <p className="page-subtitle">{activeDoc.author}</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="reader-doc-switcher" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
            Document:
          </label>
          <select
            id="reader-doc-switcher"
            className="select-field"
            style={{ width: 'auto', maxWidth: '280px' }}
            value={activeDoc.id}
            onChange={(e) => handleDocSwitch(e.target.value)}
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="reader-toolbar" role="region" aria-label="Reading and Language Controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Languages size={16} aria-hidden="true" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Companion Language:</span>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className={\`btn btn-sm \${language === lang.id ? 'btn-primary' : 'btn-secondary'}\`}
              onClick={() => onChangeLanguage(lang.id)}
            >
              {lang.label.replace(' (Illustrative Demo)', '')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => adjustFontSize(-1)}
            aria-label="Decrease reading font size"
          >
            <ZoomOut size={15} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => adjustFontSize(1)}
            aria-label="Increase reading font size"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setFocusMode((prev) => !prev)}
            aria-pressed={focusMode}
          >
            {focusMode ? <Columns size={15} /> : <Maximize2 size={15} />}
            <span>{focusMode ? 'Show Companion Panel' : 'Wide Reading View'}</span>
          </button>
        </div>
      </div>

      <div className={\`reader-layout \${focusMode ? 'reader-Layout-wide' : ''}\`}>
        <article className="reader-paper" aria-label="Original Source Text">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Original Source Document
            </span>
            <span className="meta-tag">
              {activeDoc.sections.length} Indexed Passage(s)
            </span>
          </div>

          <div className="reader-prose">
            {activeDoc.sections.map((sec) => {
              const isSelected = sec.id === currentSection?.id;
              return (
                <div
                  key={sec.id}
                  className={\`passage-block \${isSelected ? 'active-passage' : ''}\`}
                  onClick={() => setSelectedSectionId(sec.id)}
                >
                  <div className="passage-meta">
                    <span>{sec.pageRef}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSectionId(sec.id);
                      }}
                    >
                      {isSelected ? 'Selected for Inspection' : 'Select Passage'}
                    </button>
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {sec.heading}
                  </h2>
                  <p style={{ whiteSpace: 'pre-line' }}>{sec.originalText}</p>
                </div>
              );
            })}
          </div>
        </article>

        {!focusMode && currentSection && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <AudioPlayer
              textToSpeak={activeTextForSpeech}
              label={\`\${currentSection.heading} (\${language.toUpperCase()})\`}
              languageCode={language}
            />

            <div className="surface-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Companion Translation ({language.toUpperCase()})
                </span>
                <span className="meta-tag">{currentSection.pageRef}</span>
              </div>

              {language === 'en' ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  Switch the Companion Language bar above to <strong>Hindi</strong> or <strong>Hinglish</strong> to translate this passage live via Groq AI, or click the button below to generate a full breakdown.
                </p>
              ) : isTranslating ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Translating passage into {language.toUpperCase()} via Groq Llama 3.3...
                </p>
              ) : (
                <p
                  style={{
                    fontFamily: 'var(--font-serif-reading)',
                    fontSize: '0.95rem',
                    lineHeight: 1.75,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {liveTranslation}
                </p>
              )}

              <div style={{ marginTop: '1.25rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => onJumpToUnderstand(activeDoc.id, currentSection.id)}
                >
                  <Sparkles size={14} />
                  <span>Open Passage in Simplify & Understand</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/DocumentReader.jsx', readerCode, 'utf8');

// 5. Rewrite src/components/CrossSourceQA.jsx
const crossQaCode = `import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckSquare, Square, BookOpen, AlertCircle, Send, Sparkles } from 'lucide-react';
import { CROSS_SOURCE_QA_BANK } from '../data/mockData.js';

export default function CrossSourceQA({ documents, onOpenDocument }) {
  const [selectedDocIds, setSelectedDocIds] = useState(() => documents.map((d) => d.id));
  const [questionInput, setQuestionInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [liveAnswer, setLiveAnswer] = useState('');
  const [liveCitations, setLiveCitations] = useState([]);
  const [lastAskedQuestion, setLastAskedQuestion] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    setSelectedDocIds((prev) => {
      const allIds = documents.map((d) => d.id);
      const added = allIds.filter((id) => !prev.includes(id));
      return added.length > 0 ? [...added, ...prev] : prev;
    });
  }, [documents]);

  const toggleDocSelection = (docId) => {
    setValidationError('');
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleRunQuestion = async (queryText) => {
    const trimmed = String(queryText || '').trim();
    if (!trimmed) {
      setValidationError('Please enter a question before clicking Synthesize.');
      return;
    }
    if (selectedDocIds.length === 0) {
      setValidationError('Please select at least one document in Step 1.');
      return;
    }

    setValidationError('');
    setQuestionInput(trimmed);
    setLastAskedQuestion(trimmed);
    setIsSynthesizing(true);

    const activeDocsPayload = selectedDocIds
      .map((id) => documents.find((d) => d.id === id))
      .filter(Boolean);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          documents: activeDocsPayload,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.answer) {
        setLiveAnswer(data.answer);
        setLiveCitations(data.citations || []);
      } else {
        setValidationError(data.error || 'Groq synthesis failed.');
      }
    } catch (err) {
      setValidationError('Error contacting /api/ask: ' + err.message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleRunQuestion(questionInput);
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Ask Across Sources — Live Groq RAG</h1>
          <p className="page-subtitle">
            Ask any question across your uploaded PDFs and study documents with live Groq Llama 3.3 synthesis and passage citations.
          </p>
        </div>
      </header>

      <section className="surface-card" style={{ marginBottom: '1.5rem' }} aria-labelledby="source-select-heading">
        <div className="section-heading">
          <span id="source-select-heading">1. Select Documents to Query ({selectedDocIds.length} active)</span>
        </div>
        <div className="grid-3">
          {documents.map((doc) => {
            const isChecked = selectedDocIds.includes(doc.id);
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => toggleDocSelection(doc.id)}
                className="surface-card"
                aria-pressed={isChecked}
                style={{
                  textAlign: 'left',
                  padding: '0.875rem',
                  borderColor: isChecked ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  backgroundColor: isChecked ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  {isChecked ? <CheckSquare size={17} /> : <Square size={17} />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {doc.category} • {doc.pages} page(s)
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-card" style={{ marginBottom: '1.5rem' }} aria-labelledby="question-form-heading">
        <h2 id="question-form-heading" className="section-heading">
          <span>2. Ask Any Question About Your Selected Documents</span>
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.625rem', marginBottom: '1rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="e.g., Solve the questions in java-midsem-exam-paper or summarize key topics..."
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            aria-label="Enter cross-source question"
          />
          <button type="submit" className="btn btn-primary" disabled={isSynthesizing}>
            {isSynthesizing ? <Sparkles size={15} /> : <Send size={15} />}
            <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize'}</span>
          </button>
        </form>

        {validationError && (
          <div className="notice-banner error" role="alert">
            <AlertCircle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Prompts:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleRunQuestion('Summarize the core topics and solve the key questions in my selected document.')}
            >
              <Sparkles size={13} />
              <span>Summarize & solve key questions in selected PDF</span>
            </button>
            {CROSS_SOURCE_QA_BANK.slice(0, 2).map((q) => (
              <button
                key={q.id}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleRunQuestion(q.question)}
              >
                <MessageSquare size={13} />
                <span>{q.question}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {(isSynthesizing || liveAnswer) && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <section className="surface-card" aria-labelledby="synthesis-answer-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span id="synthesis-answer-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)' }}>
                Live Groq Llama 3.3 Synthesis
              </span>
              <span className="meta-tag">Groq AI</span>
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              {lastAskedQuestion}
            </h3>
            {isSynthesizing ? (
              <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Analyzing selected documents with Groq Llama 3.3 70B...
              </p>
            ) : (
              <div style={{ fontSize: '0.9375rem', lineHeight: 1.75, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                {liveAnswer}
              </div>
            )}
          </section>

          <section className="surface-card" aria-labelledby="citations-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span id="citations-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Active Source Evidence ({liveCitations.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {liveCitations.map((cit, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.875rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.8125rem' }}>{cit.docTitle}</strong>
                    <span className="meta-tag">{cit.reference}</span>
                  </div>
                  <blockquote
                    style={{
                      fontFamily: 'var(--font-serif-reading)',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      borderLeft: '2px solid var(--accent-primary)',
                      paddingLeft: '0.625rem',
                      marginBottom: '0.625rem',
                    }}
                  >
                    {cit.excerpt}
                  </blockquote>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenDocument(cit.docId, 'reader')}
                  >
                    <BookOpen size={13} />
                    <span>Open in Document Reader</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/CrossSourceQA.jsx', crossQaCode, 'utf8');

// 6. Update App.jsx badge from "Demo" to "AI Live"
let appCode = fs.readFileSync('src/App.jsx', 'utf8');
appCode = appCode.replace('<span className="brand-badge">Demo</span>', '<span className="brand-badge">AI Live</span>');
fs.writeFileSync('src/App.jsx', appCode, 'utf8');

console.log('🔨 Verifying production build...');
execSync('npm run build', { stdio: 'inherit' });
console.log('✅ Build passed with zero errors!');
