import React, { useState, useEffect } from 'react';
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
