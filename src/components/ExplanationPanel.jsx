import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, BookOpen, Languages, RefreshCw, AlertCircle } from 'lucide-react';
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
  const sections = Array.isArray(activeDoc?.sections) ? activeDoc.sections : [];
  const currentSection =
    sections.find((s) => s.id === activeSectionId) || sections[0] || null;

  const [aiExplanation, setAiExplanation] = useState('');
  const [responseMeta, setResponseMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  // Monotonically increasing request counter + AbortController to prevent race conditions
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const handleDocChange = (newDocId) => {
    onSelectDocId(newDocId);
    const found = documents.find((d) => d.id === newDocId);
    if (found?.sections?.[0]) {
      onSelectSectionId(found.sections[0].id);
    }
  };

  const executeExplanationRequest = useCallback(
    async ({ doc, section, style, lang, regenerateNonce = 0 }) => {
      // Cancel any in-flight superseded request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const thisRequestId = ++activeRequestIdRef.current;

      // Clear stale output immediately so old explanation never masquerades as new
      setAiExplanation('');
      setResponseMeta(null);
      setErrorState(null);

      const rawPassageText = typeof section?.originalText === 'string' ? section.originalText.trim() : '';
      if (!doc || !section || !rawPassageText) {
        setIsLoading(false);
        setErrorState({
          code: 'MISSING_DOCUMENT_CONTENT',
          message:
            'The selected document or passage does not contain readable source text. Please choose a valid section or extract a digital PDF.',
        });
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);

      try {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: doc.id,
            documentTitle: doc.title,
            pageRef: section.pageRef || '',
            sectionHeading: section.heading || '',
            text: rawPassageText,
            style,
            language: lang,
            mode: 'explain',
            regenerateNonce,
          }),
          signal: controller.signal,
        });

        let payload = null;
        try {
          payload = await res.json();
        } catch {
          if (thisRequestId !== activeRequestIdRef.current) return;
          setErrorState({
            code: 'FRONTEND_JSON_PARSE_ERROR',
            message: `Server returned an invalid response (HTTP ${res.status}).`,
          });
          setIsLoading(false);
          return;
        }

        // Stale response guard: ignore if a newer request was started
        if (thisRequestId !== activeRequestIdRef.current) {
          return;
        }

        if (!res.ok || !payload?.success || payload?.incomplete) {
          setErrorState({
            code: payload?.code || `HTTP_${res.status}`,
            message:
              payload?.error ||
              'Groq AI could not generate a complete explanation for this passage.',
          });
          setIsLoading(false);
          return;
        }

        const fullExplanation =
          typeof payload.explanation === 'string' ? payload.explanation.trim() : '';
        if (!fullExplanation) {
          setErrorState({
            code: 'EMPTY_EXPLANATION',
            message: 'The AI service returned an empty explanation.',
          });
          setIsLoading(false);
          return;
        }

        setAiExplanation(fullExplanation);
        setResponseMeta({
          requestId: payload.requestId,
          model: payload.model,
          style: payload.style,
          language: payload.language,
          finishReason: payload.finishReason,
        });
        setIsLoading(false);
      } catch (err) {
        if (err?.name === 'AbortError') {
          return;
        }
        if (thisRequestId !== activeRequestIdRef.current) {
          return;
        }
        setErrorState({
          code: 'NETWORK_ERROR',
          message: 'Network error while contacting /api/explain: ' + (err?.message || String(err)),
        });
        setIsLoading(false);
      }
    },
    []
  );

  // Trigger fresh generation whenever document, passage, style, or language changes
  useEffect(() => {
    executeExplanationRequest({
      doc: activeDoc,
      section: currentSection,
      style: explanationStyle,
      lang: language,
      regenerateNonce: 0,
    });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    activeDoc?.id,
    currentSection?.id,
    currentSection?.originalText,
    explanationStyle,
    language,
    executeExplanationRequest,
  ]);

  const handleRegenerateClick = () => {
    if (isLoading) return;
    executeExplanationRequest({
      doc: activeDoc,
      section: currentSection,
      style: explanationStyle,
      lang: language,
      regenerateNonce: Date.now(),
    });
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Understand — Live AI Explanations</h1>
          <p className="page-subtitle">
            Compare your selected document passage with live, context-grounded Groq AI explanations in Simple, Detailed, or Exam-Focused mode.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRegenerateClick}
            disabled={isLoading || !currentSection}
            aria-label="Regenerate explanation with Groq AI"
          >
            <RefreshCw size={14} />
            <span>{isLoading ? 'Generating...' : 'Regenerate'}</span>
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
              2. Select Page / Passage ({sections.length} available)
            </label>
            <select
              id="understand-sec-select"
              className="select-field"
              value={currentSection?.id || ''}
              onChange={(e) => onSelectSectionId(e.target.value)}
            >
              {sections.map((sec) => (
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
                className={`btn btn-sm ${explanationStyle === st.id ? 'btn-primary' : 'btn-secondary'}`}
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
                className={`btn btn-sm ${language === lang.id ? 'btn-primary' : 'btn-secondary'}`}
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
                Original Source Text ({activeDoc?.title})
              </span>
              <span className="meta-tag">{currentSection.pageRef}</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif-reading)', fontSize: '1.25rem', marginBottom: '0.625rem' }}>
              {currentSection.heading}
            </h2>

            <div
              style={{
                fontFamily: 'var(--font-serif-reading)',
                fontSize: '1.0625rem',
                lineHeight: 1.75,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '560px',
                overflowY: 'auto',
                paddingRight: '0.5rem',
              }}
            >
              {currentSection.originalText}
            </div>
          </section>

          <section
            className="surface-card"
            aria-labelledby="ai-exp-heading"
            style={{ borderColor: 'var(--accent-border)', backgroundColor: 'var(--bg-surface)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span id="ai-exp-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)' }}>
                Groq Live Explanation • {EXPLANATION_STYLES.find((s) => s.id === explanationStyle)?.label}
              </span>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                {responseMeta?.model && (
                  <span className="meta-tag">{responseMeta.model}</span>
                )}
                <span className="meta-tag">
                  {LANGUAGES.find((l) => l.id === language)?.label.replace(' (Illustrative Demo)', '')}
                </span>
              </div>
            </div>

            {isLoading ? (
              <div
                role="status"
                aria-live="polite"
                style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}
              >
                <Sparkles size={20} style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }} />
                <div style={{ fontWeight: 600 }}>Generating Live Groq Explanation...</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Analyzing "{currentSection.heading}" ({currentSection.pageRef}) in{' '}
                  {LANGUAGES.find((l) => l.id === language)?.label.replace(' (Illustrative Demo)', '')}
                </div>
              </div>
            ) : errorState ? (
              <div role="alert">
                <div className="notice-banner error" style={{ marginBottom: '0.75rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                      Explanation Generation Failed ({errorState.code})
                    </strong>
                    <span>{errorState.message}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleRegenerateClick}
                >
                  <RefreshCw size={14} />
                  <span>Retry with Groq AI</span>
                </button>
              </div>
            ) : (
              <>
                <div
                  data-testid="live-explanation-output"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.975rem',
                    lineHeight: 1.78,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'var(--text-primary)',
                    marginBottom: '1.25rem',
                    maxHeight: '560px',
                    overflowY: 'auto',
                    paddingRight: '0.5rem',
                  }}
                >
                  {aiExplanation}
                </div>

                <AudioPlayer
                  textToSpeak={aiExplanation}
                  label={`${currentSection.heading} (${explanationStyle} explanation)`}
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
