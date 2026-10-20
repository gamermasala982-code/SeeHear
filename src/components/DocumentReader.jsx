import React, { useState, useEffect } from 'react';
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
              className={`btn btn-sm ${language === lang.id ? 'btn-primary' : 'btn-secondary'}`}
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

      <div className={`reader-layout ${focusMode ? 'reader-Layout-wide' : ''}`}>
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
                  className={`passage-block ${isSelected ? 'active-passage' : ''}`}
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
              label={`${currentSection.heading} (${language.toUpperCase()})`}
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
