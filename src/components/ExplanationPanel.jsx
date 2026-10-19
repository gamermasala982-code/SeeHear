import React from 'react';
import { Sparkles, BookOpen, Languages } from 'lucide-react';
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

  const handleDocChange = (newDocId) => {
    onSelectDocId(newDocId);
    const found = documents.find((d) => d.id === newDocId);
    if (found?.sections?.[0]) {
      onSelectSectionId(found.sections[0].id);
    }
  };

  const [liveExplanation, setLiveExplanation] = React.useState(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    if (!currentSection) return;
    setIsGenerating(true);
    fetch("/api/v1/ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: currentSection.originalText,
        style: explanationStyle,
        language: language
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.explanation) setLiveExplanation(data.explanation);
      setIsGenerating(false);
    })
    .catch(() => setIsGenerating(false));
  }, [currentSection?.id, explanationStyle, language]);

  const fallbackExplanationText =
    liveExplanation || fallbackExplanationText;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Understand — Simplified Explanations</h1>
          <p className="page-subtitle">
            Compare the original academic passage with structured Simple, Detailed, and Exam-Focused breakdowns in your chosen language.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('reader')}
        >
          <BookOpen size={14} />
          <span>View Full Document in Reader</span>
        </button>
      </header>

      <div className="notice-banner">
        <span>
          <strong>Illustrative Local Explanations:</strong> Explanations below are deterministic, human-authored demo study notes linked to each source passage—no live LLM API is invoked.
        </span>
      </div>

      {/* Controls Bar */}
      <section className="surface-card" style={{ marginBottom: '1.5rem' }} aria-label="Passage and Style Selection">
        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div>
            <label htmlFor="understand-doc-select" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              1. Select Document
            </label>
            <select
              id="understand-doc-select"
              className="select-field"
              value={activeDoc.id}
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
              2. Select Passage / Section
            </label>
            <select
              id="understand-sec-select"
              className="select-field"
              value={currentSection?.id || ''}
              onChange={(e) => onSelectSectionId(e.target.value)}
            >
              {activeDoc.sections.map((sec) => (
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
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Side-by-Side Comparison */}
      {!currentSection ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p>Select a document and passage above to compare the original text with a simplified breakdown.</p>
        </div>
      ) : (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left: Original Verbatim Passage */}
          <section className="surface-card" aria-labelledby="orig-passage-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span id="orig-passage-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Original Source Text (Verbatim)
              </span>
              <span className="meta-tag">{currentSection.pageRef}</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif-reading)', fontSize: '1.25rem', marginBottom: '0.625rem' }}>
              {currentSection.heading}
            </h2>

            <p style={{ fontFamily: 'var(--font-serif-reading)', fontSize: '1.0625rem', lineHeight: 1.75, color: 'var(--text-primary)' }}>
              {currentSection.originalText}
            </p>
          </section>

          {/* Right: Simplified Demo Explanation */}
          <section
            className="surface-card"
            aria-labelledby="demo-exp-heading"
            style={{ borderColor: 'var(--accent-border)', backgroundColor: 'var(--bg-surface)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span id="demo-exp-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)' }}>
                Demo Explanation • {EXPLANATION_STYLES.find((s) => s.id === explanationStyle)?.label}
              </span>
              <span className="meta-tag">
                {LANGUAGES.find((l) => l.id === language)?.label}
              </span>
            </div>

            {explanationText ? (
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
                  {explanationText}
                </div>

                <AudioPlayer
                  textToSpeak={explanationText}
                  label={`${currentSection.heading} (${explanationStyle} explanation)`}
                  languageCode={language}
                />
              </>
            ) : (
              <div className="notice-banner warning" style={{ marginBottom: 0 }}>
                <span>
                  A predefined explanation is not stored for this local custom file passage. Try one of the three built-in academic sample documents to explore Simple, Detailed, and Exam-focused explanations across English, Hindi, and Hinglish.
                </span>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
