import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  CheckSquare,
  Square,
  BookOpen,
  AlertCircle,
  Send,
  Search,
  FileText,
  FileSearch,
  ExternalLink,
  Loader2,
  ArrowLeft
} from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "Summarize the core topics and solve the key questions in my selected document.",
  "What did A.K. Gopalan decide?",
  "How has Article 21 evolved?",
  "Why does Dijkstra fail on negative edge weights while Bellman-Ford succeeds?"
];

export default function CrossSourceQA({
  documents,
  onOpenDocument,
  language = "en",
  onNavigate
}) {
  const [selectedDocIds, setSelectedDocIds] = useState(() => documents.map((d) => d.id));
  const [searchQuery, setSearchQuery] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [validationError, setValidationError] = useState(null);
  
  const [liveAnswer, setLiveAnswer] = useState("");
  const [liveCitations, setLiveCitations] = useState([]);
  const [skippedDocs, setSkippedDocs] = useState([]);
  const [responseMeta, setResponseMeta] = useState(null);
  const [lastAskedQuestion, setLastAskedQuestion] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Auto-select newly uploaded documents
  useEffect(() => {
    setSelectedDocIds((prev) => {
      const allIds = documents.map((d) => d.id);
      const added = allIds.filter((id) => !prev.includes(id));
      return added.length > 0 ? [...added, ...prev] : prev;
    });
  }, [documents]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.category && d.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleDocSelection = (docId) => {
    setValidationError(null);
    setLiveAnswer("");
    setLiveCitations([]);
    setResponseMeta(null);
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleClearAll = () => setSelectedDocIds([]);

  const handleRunQuestion = async (queryText) => {
    const trimmed = String(queryText ?? questionInput ?? "").trim();

    if (!trimmed) {
      setValidationError({
        code: "EMPTY_QUESTION",
        message: "Please enter a question or click a suggested prompt.",
      });
      return;
    }

    const activeDocsPayload = selectedDocIds
      .map((id) => documents.find((d) => d.id === id))
      .filter(Boolean);

    if (activeDocsPayload.length === 0) {
      setValidationError({
        code: "NO_DOCUMENTS_SELECTED",
        message: "Please select at least one document from the list.",
      });
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const thisRequestId = ++activeRequestIdRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setValidationError(null);
    setLiveAnswer("");
    setLiveCitations([]);
    setSkippedDocs([]);
    setResponseMeta(null);
    setQuestionInput(trimmed);
    setLastAskedQuestion(trimmed);
    setIsSynthesizing(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          documents: activeDocsPayload,
          language: language,
        }),
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        if (thisRequestId !== activeRequestIdRef.current) return;
        setValidationError({
          code: "INVALID_SERVER_JSON",
          message: `Server returned an unreadable response (HTTP ${res.status}).`,
        });
        setIsSynthesizing(false);
        return;
      }

      if (thisRequestId !== activeRequestIdRef.current) return;

      if (!res.ok || !data?.success || data?.incomplete) {
        setValidationError({
          code: data?.code || `HTTP_${res.status}`,
          message: data?.error || "AI synthesis failed.",
        });
        setIsSynthesizing(false);
        return;
      }

      const answerText = typeof data.answer === "string" ? data.answer.trim() : "";
      if (!answerText) {
        setValidationError({
          code: "EMPTY_ANSWER",
          message: "The AI service returned an empty response.",
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
      });
      setIsSynthesizing(false);
    } catch (err) {
      if (err?.name === "AbortError") return;
      if (thisRequestId !== activeRequestIdRef.current) return;
      setValidationError({
        code: "NETWORK_ERROR",
        message: "Network error contacting server: " + (err?.message || String(err)),
      });
      setIsSynthesizing(false);
    }
  };

  const getDocIconColor = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("law") || t.includes("constitution")) return { bg: "#FEE2E2", fg: "#EF4444" };
    if (t.includes("physics") || t.includes("thermo")) return { bg: "#DBEAFE", fg: "#3B82F6" };
    if (t.includes("graph") || t.includes("computer")) return { bg: "#D1FAE5", fg: "#10B981" };
    if (t.includes("political")) return { bg: "#F3E8FF", fg: "#A855F7" };
    return { bg: "#FEF3C7", fg: "#F59E0B" };
  };

  return (
    <div style={{ width: "100%", maxWidth: "1500px", margin: "0 auto", boxSizing: "border-box" }}>
      
      {/* 1. Header */}
      <header style={{ marginBottom: "2rem" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ padding: "0", marginBottom: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}
          onClick={() => onNavigate("documents")}
        >
          <ArrowLeft size={16} style={{ marginRight: "0.25rem" }} /> Back to My Documents
        </button>
        <h1 style={{ 
          fontFamily: "var(--font-serif-reading)", 
          fontSize: "2.5rem", 
          fontWeight: 700, 
          color: "var(--text-primary)", 
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em"
        }}>
          Ask Across Sources
        </h1>
        <p style={{ fontSize: "1.0625rem", color: "var(--text-secondary)" }}>
          Ask a question across your selected documents and explore the evidence behind the answer.
        </p>
      </header>

      {/* 2. Main Three-Column Grid */}
      <div 
        className="ask-workspace-grid"
        style={{ 
          display: "grid", 
          gridTemplateColumns: "300px minmax(400px, 1fr) 340px", 
          gap: "1.5rem", 
          alignItems: "start" 
        }}
      >
        
        {/* Left Column: Select Documents */}
        <section style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", maxHeight: "900px" }}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Selected Documents ({selectedDocIds.length})
              </h2>
              <button type="button" onClick={handleClearAll} style={{ background: "none", border: "none", fontSize: "0.8125rem", color: "var(--text-muted)", cursor: "pointer", fontWeight: 500 }}>
                Clear All
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "0.5rem 0.5rem 0.5rem 2.25rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "0.875rem", boxSizing: "border-box" }}
              />
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filteredDocs.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                const iconColor = getDocIconColor(doc.title);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocSelection(doc.id)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.75rem",
                      borderRadius: "6px", cursor: "pointer",
                      background: isSelected ? "var(--bg-canvas)" : "transparent",
                      border: isSelected ? "1px solid var(--border-subtle)" : "1px solid transparent",
                    }}
                  >
                    <div style={{ color: isSelected ? "#1E293B" : "var(--text-muted)", marginTop: "2px" }}>
                      {isSelected ? <CheckSquare size={18} fill="#1E293B" color="#FFF" /> : <Square size={18} />}
                    </div>
                    <div style={{ width: "28px", height: "32px", borderRadius: "4px", background: iconColor.bg, color: iconColor.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText size={16} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {doc.title}
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {doc.category || "Document"} • {doc.pages} pages
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredDocs.length === 0 && (
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", textAlign: "center", marginTop: "1rem" }}>
                  No documents found.
                </p>
              )}
            </div>
          </div>

          <div style={{ padding: "1rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <FileText size={14}/> {selectedDocIds.length} documents selected
            </span>
            <span style={{ cursor: "pointer", color: "var(--accent-primary)", fontWeight: 500 }} onClick={() => onNavigate("documents")}>
              View All
            </span>
          </div>
        </section>

        {/* Center Column: Question & Answer Workspace */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Question Input Panel */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
              Ask a Question
            </h2>
            
            <form 
              onSubmit={(e) => { e.preventDefault(); handleRunQuestion(questionInput); }} 
              style={{ border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden", marginBottom: "1rem", background: "#FFFFFF", display: "flex", flexDirection: "column" }}
            >
              <textarea
                placeholder="Ask a question across your selected documents..."
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                style={{ width: "100%", minHeight: "100px", padding: "1rem", border: "none", resize: "none", fontSize: "1rem", outline: "none", fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-canvas)" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <FileText size={14}/> {selectedDocIds.length} documents selected
                </span>
                <button 
                  type="submit" 
                  disabled={isSynthesizing}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderRadius: "6px", background: "#1E293B", color: "#FFF", fontSize: "0.875rem", fontWeight: 500, border: "none", cursor: isSynthesizing ? "default" : "pointer", opacity: isSynthesizing ? 0.7 : 1 }}
                >
                  {isSynthesizing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Ask Question</span>
                </button>
              </div>
            </form>

            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
                Suggested questions
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleRunQuestion(q)}
                    disabled={isSynthesizing}
                    style={{ padding: "0.5rem 0.875rem", borderRadius: "999px", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: isSynthesizing ? "default" : "pointer", textAlign: "left", lineHeight: 1.4 }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {validationError && (
              <div className="notice-banner error" style={{ marginTop: "1rem", marginBottom: 0 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{validationError.message}</span>
              </div>
            )}
          </div>

          {/* Answer Area */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "2.5rem 2rem", minHeight: "400px", display: "flex", flexDirection: "column" }}>
            {!isSynthesizing && !liveAnswer ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textAlign: "center" }}>
                <FileSearch size={48} strokeWidth={1} style={{ marginBottom: "1rem", color: "var(--border-subtle)" }} />
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Your answer will appear here
                </h3>
                <p style={{ fontSize: "0.9375rem", maxWidth: "320px", lineHeight: 1.5 }}>
                  Select documents, ask a question, and get insights from multiple sources with supporting evidence.
                </p>
              </div>
            ) : isSynthesizing ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                <Loader2 size={32} className="animate-spin" style={{ marginBottom: "1rem", color: "var(--accent-primary)" }} />
                <p style={{ fontSize: "0.9375rem", fontWeight: 500 }}>Synthesizing answer from selected documents...</p>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                  {lastAskedQuestion}
                </h3>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", lineHeight: 1.75, color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {liveAnswer}
                </div>
                {skippedDocs.length > 0 && (
                  <div style={{ marginTop: "2rem", padding: "0.75rem", background: "var(--status-warning-bg)", borderRadius: "6px", fontSize: "0.8125rem", color: "var(--status-warning-text)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>Note: {skippedDocs.join(", ")} contained no extractable text and were skipped.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Sources */}
        <section style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", maxHeight: "900px" }}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Sources
            </h2>
            <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", borderRadius: "999px", color: "var(--text-muted)" }}>
              {liveCitations.length} sources
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {liveCitations.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", padding: "2rem 0" }}>
                Supporting source excerpts will appear here once an answer is generated.
              </div>
            ) : (
              liveCitations.map((cit, idx) => {
                const iconColor = getDocIconColor(cit.docTitle);
                return (
                  <div key={idx} style={{ padding: "1rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", background: "#FFFFFF", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <div style={{ width: "24px", height: "28px", borderRadius: "4px", background: iconColor.bg, color: iconColor.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileText size={14} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem", lineHeight: 1.3 }}>
                          {cit.docTitle}
                        </h4>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {cit.reference} • Document
                        </p>
                      </div>
                    </div>
                    
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                      "{cit.excerpt}"
                    </p>
                    
                    <button 
                      type="button" 
                      onClick={() => onOpenDocument(cit.docId, "reader")}
                      style={{ alignSelf: "flex-start", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "transparent", fontSize: "0.8125rem", color: "var(--text-primary)", cursor: "pointer" }}
                    >
                      View in Document <ExternalLink size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>
      
      {/* Global Responsive Styles for Ask Across Sources */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1200px) {
          .ask-workspace-grid { grid-template-columns: 260px 1fr !important; }
          .ask-workspace-grid > section:last-child { grid-column: 1 / -1; height: auto !important; max-height: none !important; }
        }
        @media (max-width: 768px) {
          .ask-workspace-grid { grid-template-columns: 1fr !important; }
          .ask-workspace-grid > section:first-child { height: 400px !important; }
        }
      `}} />
    </div>
  );
}
