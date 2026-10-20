import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  BookOpen,
  FileSignature,
  Highlighter,
  Sparkles,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText
} from "lucide-react";
import { LANGUAGES, EXPLANATION_STYLES } from "../data/mockData.js";
import AudioPlayer from "./AudioPlayer.jsx";

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
  settings,
}) {
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const sections = Array.isArray(activeDoc?.sections) ? activeDoc.sections : [];
  const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0] || null;

  const [aiExplanation, setAiExplanation] = useState("");
  const [responseMeta, setResponseMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  const [activeTab, setActiveTab] = useState("explanation"); // explanation | notes | highlights
  const [focusMode, setFocusMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [questionInput, setQuestionInput] = useState("");
  
  const currentIndex = sections.findIndex(s => s.id === currentSection?.id);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
  const totalPages = sections.length || 1;

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const handleDocChange = (newDocId) => {
    onSelectDocId(newDocId);
    const found = documents.find((d) => d.id === newDocId);
    if (found?.sections?.[0]) {
      onSelectSectionId(found.sections[0].id);
    }
  };

  const handlePrev = () => {
    if (safeCurrentIndex > 0) onSelectSectionId(sections[safeCurrentIndex - 1].id);
  };
  
  const handleNext = () => {
    if (safeCurrentIndex < totalPages - 1) onSelectSectionId(sections[safeCurrentIndex + 1].id);
  };

  const adjustFontSize = (delta) => {
    setZoomLevel(prev => Math.max(50, Math.min(200, prev + (delta * 10))));
  };

  const executeExplanationRequest = useCallback(
    async ({ doc, section, style, lang, regenerateNonce = 0 }) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const thisRequestId = ++activeRequestIdRef.current;

      setAiExplanation("");
      setResponseMeta(null);
      setErrorState(null);

      const rawPassageText = typeof section?.originalText === "string" ? section.originalText.trim() : "";
      if (!doc || !section || !rawPassageText) {
        setIsLoading(false);
        setErrorState({
          code: "MISSING_DOCUMENT_CONTENT",
          message: "The selected document or passage does not contain readable source text.",
        });
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsLoading(true);

      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: doc.id,
            documentTitle: doc.title,
            pageRef: section.pageRef || "",
            sectionHeading: section.heading || "",
            text: rawPassageText,
            style,
            language: lang,
            mode: "explain",
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
            code: "FRONTEND_JSON_PARSE_ERROR",
            message: `Server returned an invalid response (HTTP ${res.status}).`,
          });
          setIsLoading(false);
          return;
        }

        if (thisRequestId !== activeRequestIdRef.current) return;

        if (!res.ok || !payload?.success || payload?.incomplete) {
          setErrorState({
            code: payload?.code || `HTTP_${res.status}`,
            message: payload?.error || "AI service could not generate a complete explanation.",
          });
          setIsLoading(false);
          return;
        }

        const fullExplanation = typeof payload.explanation === "string" ? payload.explanation.trim() : "";
        if (!fullExplanation) {
          setErrorState({
            code: "EMPTY_EXPLANATION",
            message: "The AI service returned an empty explanation.",
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
        if (err?.name === "AbortError") return;
        if (thisRequestId !== activeRequestIdRef.current) return;
        setErrorState({
          code: "NETWORK_ERROR",
          message: "Network error contacting /api/explain: " + (err?.message || String(err)),
        });
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    executeExplanationRequest({
      doc: activeDoc,
      section: currentSection,
      style: explanationStyle,
      lang: language,
      regenerateNonce: 0,
    });

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [
    activeDoc?.id,
    currentSection?.id,
    currentSection?.originalText,
    explanationStyle,
    language,
    executeExplanationRequest,
  ]);

  if (!activeDoc) return null;

  const displayStyleLabel = EXPLANATION_STYLES.find((s) => s.id === explanationStyle)?.label || "Explanation";

  return (
    <div style={{ width: "100%", maxWidth: "1440px", margin: "0 auto", boxSizing: "border-box" }}>
      
      {/* 1. Header Area */}
      <header style={{ marginBottom: "1.5rem" }}>
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
          fontSize: "2rem", 
          fontWeight: 700, 
          color: "var(--text-primary)", 
          marginBottom: "0.5rem",
          lineHeight: 1.2,
          wordBreak: "break-word"
        }}>
          {activeDoc.title}
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          {activeDoc.author || "Unknown Author"} • {activeDoc.category || "Document"}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <label htmlFor="understand-doc-select" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)" }}>
            Document:
          </label>
          <select
            id="understand-doc-select"
            className="select-field"
            style={{ width: "auto", minWidth: "300px", padding: "0.375rem 0.75rem" }}
            value={activeDoc.id}
            onChange={(e) => handleDocChange(e.target.value)}
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>
      </header>

      {/* 2. Reading Toolbar */}
      <div 
        style={{ 
          display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", 
          gap: "1rem", padding: "0.75rem", background: "var(--bg-surface)", 
          border: "1px solid var(--border-subtle)", borderRadius: "8px", marginBottom: "1.5rem" 
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" className="btn btn-primary btn-sm" style={{ background: "#1E293B", color: "#FFF", border: "none" }}>
            <FileText size={14} style={{ marginRight: "0.375rem" }} /> Original Text
          </button>
          <button type="button" className="btn btn-secondary btn-sm" style={{ background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}>
            <FileText size={14} style={{ marginRight: "0.375rem" }} /> {language === "hi" ? "Hindi Translation" : language === "hinglish" ? "Hinglish Translation" : "Translation"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", border: "1px solid var(--border-subtle)", borderRadius: "6px", overflow: "hidden" }}>
            <button type="button" className="btn btn-ghost btn-sm" style={{ borderRight: "1px solid var(--border-subtle)", borderRadius: 0 }} onClick={() => adjustFontSize(-1)}>
              <ZoomOut size={16} />
            </button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ borderRadius: 0 }} onClick={() => adjustFontSize(1)}>
              <ZoomIn size={16} />
            </button>
          </div>
          <select className="select-field" value={zoomLevel} onChange={() => {}} style={{ width: "90px", padding: "0.375rem 0.75rem", height: "32px", fontSize: "0.875rem" }}>
            <option value={zoomLevel}>{zoomLevel}%</option>
          </select>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setFocusMode(!focusMode)}
            style={{ background: "var(--bg-surface)" }}
          >
            {focusMode ? <Columns size={14} /> : <Maximize2 size={14} />}
            <span>{focusMode ? "Show Assistant" : "Wide View"}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Two-Panel Workspace (58%-42% split) */}
      <div 
        className={`understand-workspace-grid ${focusMode ? "focus-mode" : ""}`}
        style={{ 
          display: "grid", 
          gridTemplateColumns: focusMode ? "1fr" : "minmax(0, 60%) minmax(0, 40%)", 
          gap: "1.5rem", 
          alignItems: "start" 
        }}
      >
        
        {/* A. Document Area (Thumbnails + Paper) */}
        <div style={{ display: "flex", gap: "1rem", minWidth: 0 }}>
          
          {/* Thumbnails Strip */}
          <div className="thumbnail-strip" style={{ width: "80px", display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
            {activeDoc.sections.slice(0, 6).map((sec, i) => (
              <div key={sec.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
                <div 
                  onClick={() => onSelectSectionId(sec.id)}
                  style={{
                    width: "100%", aspectRatio: "1/1.4", background: "var(--bg-surface)",
                    border: currentSection?.id === sec.id ? "2px solid #3B82F6" : "1px solid var(--border-subtle)",
                    borderRadius: "4px", cursor: "pointer", opacity: currentSection?.id === sec.id ? 1 : 0.6,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "4px"
                  }}
                >
                  <div style={{ width: "100%", height: "100%", background: "var(--border-subtle)", opacity: 0.1, borderRadius: "2px" }} />
                </div>
                <span style={{ fontSize: "0.6875rem", color: currentSection?.id === sec.id ? "var(--text-primary)" : "var(--text-muted)", fontWeight: currentSection?.id === sec.id ? 600 : 400 }}>
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Paper View */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <article 
              style={{ 
                background: "#FFFFFF", border: "1px solid var(--border-subtle)", borderRadius: "8px", 
                padding: "3rem 4rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                minHeight: "65vh", display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}
              className="document-paper-container"
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", color: "var(--text-muted)", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  <span>{currentSection?.pageRef}</span>
                  <span>{activeDoc.category || "Document"}</span>
                </div>
                <h2 style={{ fontFamily: "var(--font-serif-reading)", fontSize: "1.75rem", fontWeight: 700, color: "#1E293B", marginBottom: "1.5rem", lineHeight: 1.3 }}>
                  {currentSection?.heading}
                </h2>
                <div style={{ fontFamily: "var(--font-serif-reading)", fontSize: `${zoomLevel / 100}rem`, lineHeight: 1.8, color: "#334155", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {currentSection?.originalText}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem", marginTop: "4rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                <span>{safeCurrentIndex + 1}</span>
                <span>{activeDoc.title}</span>
              </div>
            </article>

            {/* Pagination Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "0 1rem" }}>
              <button type="button" className="btn btn-ghost" onClick={handlePrev} disabled={safeCurrentIndex === 0}>
                <ChevronLeft size={16} style={{ marginRight: "4px" }}/> Previous
              </button>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Page <span style={{ padding: "0.25rem 0.5rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "4px", margin: "0 4px" }}>{safeCurrentIndex + 1}</span> of {totalPages}
              </div>
              <button type="button" className="btn btn-ghost" onClick={handleNext} disabled={safeCurrentIndex === totalPages - 1}>
                Next <ChevronRight size={16} style={{ marginLeft: "4px" }}/>
              </button>
            </div>
          </div>
        </div>

        {/* B. Right Panel: Learning Assistant */}
        {!focusMode && (
          <aside style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            {/* Panel Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)" }}>
              <button 
                type="button" 
                onClick={() => setActiveTab("explanation")}
                style={{ flex: 1, padding: "0.875rem", fontSize: "0.875rem", fontWeight: 600, background: activeTab === "explanation" ? "#1E293B" : "transparent", color: activeTab === "explanation" ? "#FFF" : "var(--text-secondary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
              >
                <BookOpen size={16} /> Explanation
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab("notes")}
                style={{ flex: 1, padding: "0.875rem", fontSize: "0.875rem", fontWeight: 500, background: activeTab === "notes" ? "#F8FAFC" : "transparent", color: "var(--text-secondary)", border: "none", borderLeft: "1px solid var(--border-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
              >
                <FileSignature size={16} /> Notes
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab("highlights")}
                style={{ flex: 1, padding: "0.875rem", fontSize: "0.875rem", fontWeight: 500, background: activeTab === "highlights" ? "#F8FAFC" : "transparent", color: "var(--text-secondary)", border: "none", borderLeft: "1px solid var(--border-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
              >
                <Highlighter size={16} /> Highlights
              </button>
            </div>

            {activeTab === "explanation" && (
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                
                {/* 1. Simple Explanation */}
                <div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Sparkles size={16} /> {displayStyleLabel}
                  </h3>

                  <div style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "1.25rem" }}>
                    {isLoading ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem", fontStyle: "italic" }}>
                        <Loader2 size={16} className="animate-spin" /> Generating explanation...
                      </div>
                    ) : errorState ? (
                      <div className="notice-banner error" style={{ marginBottom: 0 }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{errorState.message}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem" }}>
                          {aiExplanation}
                        </div>
                        <div style={{ marginTop: "1rem" }}>
                          <AudioPlayer textToSpeak={aiExplanation} label={displayStyleLabel} languageCode={language} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Key Points */}
                <div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Lightbulb size={16} /> Key Points
                  </h3>
                  <div style={{ background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "1.25rem" }}>
                    {isLoading ? (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", fontStyle: "italic" }}>Loading key points...</div>
                    ) : aiExplanation ? (
                      <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <li>Article 21 ensures protection of life and personal liberty.</li>
                        <li>A.K. Gopalan (1950) gave a narrow interpretation.</li>
                        <li>Later cases expanded the scope to include dignity, privacy and fair procedure.</li>
                        <li>The procedure must be just, fair and reasonable.</li>
                      </ul>
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Key points will appear here...</div>
                    )}
                  </div>
                </div>

                

              </div>
            )}
            
            {activeTab !== "explanation" && (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Feature available in next update.
              </div>
            )}
          </aside>
        )}
      </div>
      
      {/* Global Responsive Styles for Understand Screen */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .understand-workspace-grid { grid-template-columns: 1fr !important; }
          .document-paper-container { padding: 2rem !important; min-height: auto !important; }
        }
        @media (max-width: 768px) {
          .thumbnail-strip { display: none !important; }
          .document-paper-container { padding: 1.5rem !important; }
        }
      `}} />
    </div>
  );
}
