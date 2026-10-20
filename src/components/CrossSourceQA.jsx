import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  CheckSquare,
  Square,
  BookOpen,
  AlertCircle,
  Send,
  Sparkles,
  Languages,
} from 'lucide-react';
import { CROSS_SOURCE_QA_BANK, LANGUAGES } from '../data/mockData.js';

export default function CrossSourceQA({
  documents,
  onOpenDocument,
  language = 'en',
  onChangeLanguage,
}) {
  const [selectedDocIds, setSelectedDocIds] = useState(() =>
    documents.map((d) => d.id)
  );
  const [questionInput, setQuestionInput] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [liveAnswer, setLiveAnswer] = useState('');
  const [liveCitations, setLiveCitations] = useState([]);
  const [skippedDocs, setSkippedDocs] = useState([]);
  const [responseMeta, setResponseMeta] = useState(null);
  const [lastAskedQuestion, setLastAskedQuestion] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Include newly uploaded documents automatically
  useEffect(() => {
    setSelectedDocIds((prev) => {
      const allIds = documents.map((d) => d.id);
      const added = allIds.filter((id) => !prev.includes(id));
      return added.length > 0 ? [...added, ...prev] : prev;
    });
  }, [documents]);

  // Cancel any in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const toggleDocSelection = (docId) => {
    setValidationError(null);
    // Clear previous result so an old answer is never mistaken as matching the new document scope
    setLiveAnswer('');
    setLiveCitations([]);
    setResponseMeta(null);
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleRunQuestion = async (queryText, overrideLang) => {
    const targetLang = overrideLang || language || 'en';
    const trimmed = String(queryText ?? questionInput ?? '').trim();

    if (!trimmed) {
      setValidationError({
        code: 'EMPTY_QUESTION',
        message: 'Please enter a question or click one of the quick prompts before synthesizing.',
      });
      return;
    }

    const activeDocsPayload = selectedDocIds
      .map((id) => documents.find((d) => d.id === id))
      .filter(Boolean);

    if (activeDocsPayload.length === 0) {
      setValidationError({
        code: 'NO_DOCUMENTS_SELECTED',
        message: 'Please select at least one source document in Step 1.',
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const thisRequestId = ++activeRequestIdRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Immediately clear stale output so old answers never remain visible during or after a new request
    setValidationError(null);
    setLiveAnswer('');
    setLiveCitations([]);
    setSkippedDocs([]);
    setResponseMeta(null);
    setQuestionInput(trimmed);
    setLastAskedQuestion(trimmed);
    setIsSynthesizing(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          documents: activeDocsPayload,
          language: targetLang,
        }),
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        if (thisRequestId !== activeRequestIdRef.current) return;
        setValidationError({
          code: 'INVALID_SERVER_JSON',
          message: `Server returned an unreadable response (HTTP ${res.status}).`,
        });
        setIsSynthesizing(false);
        return;
      }

      if (thisRequestId !== activeRequestIdRef.current) {
        return;
      }

      if (!res.ok || !data?.success || data?.incomplete) {
        setValidationError({
          code: data?.code || `HTTP_${res.status}`,
          message: data?.error || 'Groq RAG synthesis failed.',
        });
        setIsSynthesizing(false);
        return;
      }

      const answerText = typeof data.answer === 'string' ? data.answer.trim() : '';
      if (!answerText) {
        setValidationError({
          code: 'EMPTY_ANSWER',
          message: 'The AI service returned an empty synthesis response.',
        });
        setIsSynthesizing(false);
        return;
      }

      setLiveAnswer(answerText);
      setLiveCitations(Array.isArray(data.citations) ? data.citations : []);
      setSkippedDocs(Array.isArray(data.skippedDocuments) ? data.skippedDocuments : []);
      setResponseMeta({
        requestId: data.requestId,
        model: data.model,
        language: data.language || targetLang,
      });
      setIsSynthesizing(false);
    } catch (err) {
      if (err?.name === 'AbortError') {
        return;
      }
      if (thisRequestId !== activeRequestIdRef.current) {
        return;
      }
      setValidationError({
        code: 'NETWORK_ERROR',
        message: 'Network error contacting /api/ask: ' + (err?.message || String(err)),
      });
      setIsSynthesizing(false);
    }
  };

  const handleLanguageSwitch = (newLang) => {
    if (onChangeLanguage) {
      onChangeLanguage(newLang);
    }
    if (lastAskedQuestion && selectedDocIds.length > 0) {
      handleRunQuestion(lastAskedQuestion, newLang);
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
            Ask any question across your uploaded PDFs and study documents with live Groq synthesis and verified passage citations.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Languages size={15} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Output Language:</span>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className={`btn btn-sm ${language === lang.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleLanguageSwitch(lang.id)}
            >
              {lang.label.replace(' (Illustrative Demo)', '')}
            </button>
          ))}
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
            placeholder="e.g., Explain Article 21 in simple language and cite the source passage..."
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
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                Synthesis Error ({validationError.code})
              </strong>
              <span>{validationError.message}</span>
            </div>
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
              disabled={isSynthesizing}
              onClick={() => handleRunQuestion('Summarize the core topics and solve the key questions in my selected document.')}
            >
              <Sparkles size={13} />
              <span>Summarize & solve key questions in selected PDF</span>
            </button>
            {CROSS_SOURCE_QA_BANK.slice(0, 3).map((q) => (
              <button
                key={q.id}
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={isSynthesizing}
                onClick={() => handleRunQuestion(q.question)}
              >
                <MessageSquare size={13} />
                <span>{q.question}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {skippedDocs.length > 0 && (
        <div className="notice-banner warning" role="status">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Note: The following selected document(s) had no extractable text passages and were excluded from search: {skippedDocs.join(', ')}.
          </span>
        </div>
      )}

      {(isSynthesizing || liveAnswer) && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <section className="surface-card" aria-labelledby="synthesis-answer-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span id="synthesis-answer-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)' }}>
                Live Groq RAG Synthesis
              </span>
              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                {responseMeta?.model && <span className="meta-tag">{responseMeta.model}</span>}
                <span className="meta-tag">
                  {LANGUAGES.find((l) => l.id === (responseMeta?.language || language))?.label.replace(' (Illustrative Demo)', '')}
                </span>
              </div>
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              {lastAskedQuestion}
            </h3>
            {isSynthesizing ? (
              <p role="status" aria-live="polite" style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Retrieving relevant passages and synthesizing answer with Groq...
              </p>
            ) : (
              <div
                data-testid="live-rag-answer"
                style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.78,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '560px',
                  overflowY: 'auto',
                  paddingRight: '0.5rem',
                }}
              >
                {liveAnswer}
              </div>
            )}
          </section>

          <section className="surface-card" aria-labelledby="citations-heading">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span id="citations-heading" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Retrieved Source Evidence ({liveCitations.length})
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
                      whiteSpace: 'pre-wrap',
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
