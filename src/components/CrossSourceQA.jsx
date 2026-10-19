import React, { useState } from "react";
import { MessageSquare, CheckSquare, Square, BookOpen, AlertCircle, Send, Sparkles } from "lucide-react";
import { CROSS_SOURCE_QA_BANK } from "../data/mockData.js";

export default function CrossSourceQA({ documents, onOpenDocument }) {
  const [selectedDocIds, setSelectedDocIds] = useState(documents.map((d) => d.id));
  const [questionInput, setQuestionInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [activeResult, setActiveResult] = useState(CROSS_SOURCE_QA_BANK[0]);
  const [isFallbackUnmatched, setIsFallbackUnmatched] = useState(false);
  const [liveAnswer, setLiveAnswer] = useState(null);
  const [liveCitations, setLiveCitations] = useState([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const toggleDocSelection = (docId) => {
    setValidationError("");
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleRunQuestion = async (queryText) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setValidationError("Please enter a question or pick one of the example prompts before submitting.");
      return;
    }
    if (selectedDocIds.length === 0) {
      setValidationError("Please select at least one source document to query against.");
      return;
    }

    setValidationError("");
    setQuestionInput(trimmed);
    setIsSynthesizing(true);

    const activeDocsPayload = selectedDocIds
      .map(id => documents.find(d => d.id === id))
      .filter(Boolean);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, documents: activeDocsPayload })
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setLiveAnswer(data.answer);
        setLiveCitations(data.citations || []);
        setIsSynthesizing(false);
        setActiveResult(null);
        setIsFallbackUnmatched(false);
        return;
      }
    } catch (err) {
      console.error("Groq RAG error:", err);
    }

    setIsSynthesizing(false);
    const lower = trimmed.toLowerCase();
    const matched = CROSS_SOURCE_QA_BANK.find(
      (item) =>
        item.question.toLowerCase() === lower ||
        (lower.includes("gopalan") && item.id === "qa-2") ||
        (lower.includes("maneka") && item.id === "qa-2") ||
        (lower.includes("dijkstra") && item.id === "qa-3") ||
        (lower.includes("bellman") && item.id === "qa-3") ||
        (lower.includes("irreversible") && item.id === "qa-1") ||
        (lower.includes("probability") && item.id === "qa-4")
    );

    if (matched) {
      setActiveResult(matched);
      setLiveAnswer(null);
      setIsFallbackUnmatched(false);
    } else {
      setActiveResult(null);
      setLiveAnswer(null);
      setIsFallbackUnmatched(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleRunQuestion(questionInput);
  };

  const displayAnswer = liveAnswer || activeResult?.answer;
  const displayCitations = liveCitations.length > 0 ? liveCitations : (activeResult?.citations || []);
  const displayTitle = questionInput || activeResult?.question || "Cross-Source Synthesis";

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Ask Across Sources (Groq Llama 3.3 RAG)</h1>
          <p className="page-subtitle">
            Synthesize concepts across your selected reading sources with transparent page and section citations powered by Groq AI.
          </p>
        </div>
      </header>

      <div className="notice-banner">
        <span>
          <strong>Live Groq RAG Synthesis:</strong> Questions asked here are evaluated live across your active documents using Groq Llama 3.3 70B.
        </span>
      </div>

      <section className="surface-card" style={{ marginBottom: "1.5rem" }} aria-labelledby="source-select-heading">
        <div className="section-heading">
          <span id="source-select-heading">1. Active Source Documents ({selectedDocIds.length} selected)</span>
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
                  textAlign: "left",
                  padding: "0.875rem",
                  borderColor: isChecked ? "var(--accent-primary)" : "var(--border-subtle)",
                  backgroundColor: isChecked ? "var(--accent-subtle)" : "var(--bg-surface)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  {isChecked ? <CheckSquare size={17} /> : <Square size={17} />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      {doc.category} • {doc.pages} pages
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-card" style={{ marginBottom: "1.5rem" }} aria-labelledby="question-form-heading">
        <h2 id="question-form-heading" className="section-heading">
          <span>2. Ask a Cross-Source Question</span>
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem" }}>
          <input
            type="text"
            className="input-field"
            placeholder="Ask a question across your selected documents..."
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            aria-label="Enter cross-source question"
          />
          <button type="submit" className="btn btn-primary" disabled={isSynthesizing}>
            {isSynthesizing ? <Sparkles size={15} className="animate-spin" /> : <Send size={15} />}
            <span>{isSynthesizing ? "Synthesizing..." : "Synthesize"}</span>
          </button>
        </form>

        {validationError && (
          <div className="notice-banner error" role="alert">
            <AlertCircle size={16} />
            <span>{validationError}</span>
          </div>
        )}

        <div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Verified Example Questions:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {CROSS_SOURCE_QA_BANK.map((q) => (
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

      {isFallbackUnmatched && !displayAnswer && (
        <section className="surface-card" aria-live="polite">
          <div className="notice-banner warning" style={{ marginBottom: "0.75rem" }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>
              <strong>No Match Found:</strong> Please try one of the example questions above.
            </span>
          </div>
        </section>
      )}

      {(displayAnswer || isSynthesizing) && (
        <div className="grid-2" style={{ alignItems: "start" }}>
          <section className="surface-card" aria-labelledby="synthesis-answer-heading">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span id="synthesis-answer-heading" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-primary)" }}>
                {liveAnswer ? "Live Groq Llama 3.3 AI Synthesis" : "Illustrative Demo Synthesis Answer"}
              </span>
              <span className="meta-tag">{liveAnswer ? "Groq Cloud" : "Local Deterministic Output"}</span>
            </div>
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              {displayTitle}
            </h3>
            {isSynthesizing ? (
              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                Querying Groq Llama 3.3 across your selected source documents...
              </p>
            ) : (
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.75, color: "var(--text-primary)", whiteSpace: "pre-line" }}>
                {displayAnswer}
              </p>
            )}
          </section>

          <section className="surface-card" aria-labelledby="citations-heading">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span id="citations-heading" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                Supporting Source Evidence ({displayCitations.length})
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {displayCitations.map((cit, idx) => {
                const isSourceSelected = selectedDocIds.includes(cit.docId);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "0.875rem",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-canvas)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem", gap: "0.5rem", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "0.8125rem" }}>{cit.docTitle}</strong>
                      <span className="meta-tag">{cit.reference}</span>
                    </div>
                    {!isSourceSelected && (
                      <div style={{ fontSize: "0.75rem", color: "var(--status-warning-text)", marginBottom: "0.375rem" }}>
                        Note: This source is currently deselected in filter 1 above.
                      </div>
                    )}
                    <blockquote
                      style={{
                        fontFamily: "var(--font-serif-reading)",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        borderLeft: "2px solid var(--accent-primary)",
                        paddingLeft: "0.625rem",
                        marginBottom: "0.625rem",
                      }}
                    >
                      {cit.excerpt}
                    </blockquote>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenDocument(cit.docId, "reader")}
                    >
                      <BookOpen size={13} />
                      <span>Verify in Document Reader</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
