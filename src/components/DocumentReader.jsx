import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Languages,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  BookOpen,
  MessageSquare,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Send,
  Loader2,
  Highlighter,
  FileSignature
} from "lucide-react";
import { LANGUAGES } from "../data/mockData.js";
import AudioPlayer from "./AudioPlayer.jsx";

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
  const [selectedSectionId, setSelectedSectionId] = useState(activeDoc?.sections?.[0]?.id || "");
  const [focusMode, setFocusMode] = useState(false);
  const [liveTranslation, setLiveTranslation] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState("assistant"); // assistant | notes | highlights
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (activeDoc?.sections?.[0] && !activeDoc.sections.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(activeDoc.sections[0].id);
    }
  }, [activeDocId, activeDoc]);

  const currentSection =
    activeDoc?.sections?.find((s) => s.id === selectedSectionId) ||
    activeDoc?.sections?.[0];
  
  const currentIndex = activeDoc?.sections?.findIndex(s => s.id === selectedSectionId) || 0;
  const totalPages = activeDoc?.sections?.length || 1;

  // Live Groq Translation Hook (Preserved perfectly)
  useEffect(() => {
    if (!currentSection || language === "en") {
      setLiveTranslation("");
      return;
    }

    const existing = currentSection?.translations?.[language];
    if (existing) {
      setLiveTranslation(existing);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);
    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: activeDoc.id,
        documentTitle: activeDoc.title,
        pageRef: currentSection.pageRef,
        sectionHeading: currentSection.heading,
        text: currentSection.originalText,
        style: "simple",
        language,
        mode: "translate",
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.explanation) {
          setLiveTranslation(data.explanation);
        } else {
          setLiveTranslation("Translation unavailable: " + (data.error || "Unknown error"));
        }
        setIsTranslating(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLiveTranslation("Translation error: " + err.message);
        setIsTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentSection?.id, language, activeDoc]);

  const handlePrev = () => {
    if (currentIndex > 0) setSelectedSectionId(activeDoc.sections[currentIndex - 1].id);
  };
  
  const handleNext = () => {
    if (currentIndex < totalPages - 1) setSelectedSectionId(activeDoc.sections[currentIndex + 1].id);
  };

  const adjustFontSize = (delta) => {
    const sizes = ["0.95rem", "1.0625rem", "1.1875rem", "1.3125rem"];
    const currentIndex = sizes.indexOf(settings.readerFontSize);
    const baseIdx = currentIndex === -1 ? 1 : currentIndex;
    const nextIdx = Math.min(sizes.length - 1, Math.max(0, baseIdx + delta));
    onUpdateSettings({ readerFontSize: sizes[nextIdx] });
    setZoomLevel(prev => Math.max(50, Math.min(200, prev + (delta * 15))));
  };

  const activeTextForSpeech =
    language === "en"
      ? currentSection?.originalText
      : liveTranslation || currentSection?.originalText;

  if (!activeDoc) return null;

  return (
    <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>
      
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
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
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
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {activeDoc.category || "Document"} • {activeDoc.pages} pages • {activeDoc.sourceType.includes("PDF") ? "PDF" : "DOCX"}
            </p>
          </div>
          
          <button type="button" className="btn btn-secondary btn-sm" style={{ flexShrink: 0, background: "var(--bg-surface)" }}>
            <MoreHorizontal size={14} style={{ marginRight: "0.375rem" }} /> Document Options
          </button>
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <Languages size={18} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>Companion Language:</span>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                className={`btn btn-sm ${language === lang.id ? "btn-primary" : "btn-ghost"}`}
                style={{
                  background: language === lang.id ? "#1E293B" : "transparent",
                  color: language === lang.id ? "#FFF" : "var(--text-secondary)",
                  border: language === lang.id ? "none" : "1px solid var(--border-subtle)"
                }}
                onClick={() => onChangeLanguage(lang.id)}
              >
                {lang.label.replace(" (Illustrative Demo)", "")}
              </button>
            ))}
          </div>
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
            <span>{focusMode ? "Show Tools" : "Wide Reading View"}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Two-Panel Workspace */}
      <div 
        className={`reader-workspace-grid ${focusMode ? "focus-mode" : ""}`}
        style={{ 
          display: "grid", 
          gridTemplateColumns: focusMode ? "1fr" : "minmax(0, 1.8fr) minmax(0, 1fr)", 
          gap: "1.5rem", 
          alignItems: "start" 
        }}
      >
        
        {/* A. Document Area (Thumbnails + Paper) */}
        <div style={{ display: "flex", gap: "1rem", minWidth: 0 }}>
          
          {/* Thumbnails Strip (Desktop only) */}
          <div className="thumbnail-strip" style={{ width: "80px", display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
            {activeDoc.sections.slice(0, 6).map((sec, i) => (
              <div key={sec.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
                <div 
                  onClick={() => setSelectedSectionId(sec.id)}
                  style={{
                    width: "100%", aspectRatio: "1/1.4", background: "var(--bg-surface)",
                    border: selectedSectionId === sec.id ? "2px solid #3B82F6" : "1px solid var(--border-subtle)",
                    borderRadius: "4px", cursor: "pointer", opacity: selectedSectionId === sec.id ? 1 : 0.6,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "4px"
                  }}
                >
                  <div style={{ width: "100%", height: "100%", background: "var(--border-subtle)", opacity: 0.1, borderRadius: "2px" }} />
                </div>
                <span style={{ fontSize: "0.6875rem", color: selectedSectionId === sec.id ? "var(--text-primary)" : "var(--text-muted)", fontWeight: selectedSectionId === sec.id ? 600 : 400 }}>
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Paper View */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <article 
              style={{ 
                background: "#FFFFFF", 
                border: "1px solid var(--border-subtle)", 
                borderRadius: "8px", 
                padding: "3rem 4rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                minHeight: "75vh",
                display: "flex", flexDirection: "column", justifyContent: "space-between"
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

                <div style={{ fontFamily: "var(--font-serif-reading)", fontSize: settings.readerFontSize || "1.0625rem", lineHeight: 1.8, color: "#334155", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {currentSection?.originalText}
                </div>
              </div>

              {/* Bottom Document Details */}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem", marginTop: "4rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                <span>{currentIndex + 1}</span>
                <span>{activeDoc.title}</span>
              </div>
            </article>

            {/* Pagination Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "0 1rem" }}>
              <button type="button" className="btn btn-ghost" onClick={handlePrev} disabled={currentIndex === 0}>
                <ChevronLeft size={16} style={{ marginRight: "4px" }}/> Previous
              </button>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                Page <span style={{ padding: "0.25rem 0.5rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "4px", margin: "0 4px" }}>{currentIndex + 1}</span> of {totalPages}
              </div>
              <button type="button" className="btn btn-ghost" onClick={handleNext} disabled={currentIndex === totalPages - 1}>
                Next <ChevronRight size={16} style={{ marginLeft: "4px" }}/>
              </button>
            </div>
          </div>
        </div>

        {/* B. Right Panel: Reading Assistant */}
        {!focusMode && (
          <aside style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            {/* Panel Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)" }}>
              <button 
                type="button" 
                onClick={() => setActiveTab("assistant")}
                style={{ flex: 1, padding: "0.875rem", fontSize: "0.875rem", fontWeight: 600, background: activeTab === "assistant" ? "#1E293B" : "transparent", color: activeTab === "assistant" ? "#FFF" : "var(--text-secondary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
              >
                <BookOpen size={16} /> Reading Assistant
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

            {activeTab === "assistant" && (
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                
                {/* 1. Quick Actions */}
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Sparkles size={16} /> Quick Actions
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button type="button" onClick={() => onJumpToUnderstand(activeDoc.id, currentSection.id)} style={{ padding: "0.625rem", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", color: "var(--text-primary)" }}>
                      <Sparkles size={14} style={{color: "var(--text-muted)"}}/> Simplify Text
                    </button>
                    <button type="button" onClick={() => onChangeLanguage("hi")} style={{ padding: "0.625rem", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", color: "var(--text-primary)" }}>
                      <Languages size={14} style={{color: "var(--text-muted)"}}/> Translate
                    </button>
                    <button type="button" onClick={() => onJumpToUnderstand(activeDoc.id, currentSection.id)} style={{ padding: "0.625rem", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", color: "var(--text-primary)" }}>
                      <FileText size={14} style={{color: "var(--text-muted)"}}/> Summarize
                    </button>
                    <button type="button" style={{ padding: "0.625rem", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "6px", fontSize: "0.8125rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.375rem", cursor: "pointer", color: "var(--text-primary)" }}>
                      <MessageSquare size={14} style={{color: "var(--text-muted)"}}/> Ask a Question
                    </button>
                  </div>
                </div>

                {/* 2. Translation block */}
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Languages size={16} /> Translation
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <select className="select-field" style={{ flex: 1, padding: "0.5rem", fontSize: "0.875rem" }} value={language} onChange={(e) => onChangeLanguage(e.target.value)}>
                      {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label.replace(" (Illustrative Demo)", "")}</option>)}
                    </select>
                    <button type="button" className="btn btn-primary" style={{ background: "#1E293B", padding: "0 1rem", border: "none" }} onClick={() => {}}>
                      <Sparkles size={14} /> Translate
                    </button>
                  </div>
                  <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "1rem" }}>
                    {language === "en" ? (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                        <Sparkles size={16} style={{ flexShrink: 0 }} />
                        <div>
                          <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Translation will appear here...</p>
                          <p>Select a language above and click translate to see the translated text.</p>
                        </div>
                      </div>
                    ) : isTranslating ? (
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Loader2 size={16} className="animate-spin" /> Translating...
                      </div>
                    ) : (
                      <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                        {liveTranslation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Audio Player included cleanly if active */}
                {(activeTextForSpeech && language !== "en" && !isTranslating) && (
                   <AudioPlayer textToSpeak={activeTextForSpeech} label={language.toUpperCase() + " Translation"} languageCode={language} />
                )}

                {/* 3. Key Takeaways */}
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <BookOpen size={16} /> Key Takeaways
                  </h3>
                  <div style={{ background: "var(--bg-canvas)", border: "1px dashed var(--border-subtle)", borderRadius: "8px", padding: "1rem", color: "var(--text-muted)", fontSize: "0.8125rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <Sparkles size={16} /> Important points from this document will appear here...
                  </div>
                </div>



              </div>
            )}
            
            {activeTab !== "assistant" && (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Feature available in next update.
              </div>
            )}
          </aside>
        )}
      </div>
      
      {/* Global Responsive Styles for Reader */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .reader-workspace-grid { grid-template-columns: 1fr !important; }
          .document-paper-container { padding: 2rem !important; }
        }
        @media (max-width: 768px) {
          .thumbnail-strip { display: none !important; }
          .document-paper-container { padding: 1.5rem !important; }
        }
      `}} />
    </div>
  );
}
