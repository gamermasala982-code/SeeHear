import React, { useState, useEffect } from 'react';
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
