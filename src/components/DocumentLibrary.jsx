import React, { useState, useRef } from "react";
import {
  Upload,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  BookOpen,
  Sparkles,
  CloudUpload,
  FileText,
  ChevronRight
} from "lucide-react";

const ALLOWED_EXTENSIONS = [".txt", ".md", ".pdf", ".docx", ".epub"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Browser FileReader failed to read file."));
    reader.readAsDataURL(file);
  });
}

// Map file extensions/categories to specific icon colors like the reference design
function getFileIconStyle(title = "", category = "") {
  const t = title.toLowerCase();
  const c = category.toLowerCase();
  if (t.includes("law") || t.includes("constitution") || c.includes("law")) {
    return { bg: "#FEE2E2", color: "#EF4444", text: "PDF" }; // Red
  }
  if (t.includes("physics") || t.includes("entropy") || c.includes("physics")) {
    return { bg: "#DBEAFE", color: "#3B82F6", text: "DOC" }; // Blue
  }
  if (t.includes("graph") || t.includes("algorithm") || c.includes("computer")) {
    return { bg: "#D1FAE5", color: "#10B981", text: "PDF" }; // Green
  }
  if (t.includes("political") || t.includes("history")) {
    return { bg: "#F3E8FF", color: "#A855F7", text: "PDF" }; // Purple
  }
  return { bg: "#FEF3C7", color: "#F59E0B", text: "TXT" }; // Yellow default
}

export default function DocumentLibrary({
  documents,
  onAddLocalDocument,
  onOpenDocument,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [extractionStatus, setExtractionStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const categories = Array.from(new Set(documents.map((d) => d.category))).filter(Boolean);

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = categoryFilter === "ALL" || doc.category === categoryFilter;
    const matchesQuery =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  };

  const handleFileValidation = (file) => {
    setUploadError("");
    setExtractionStatus(null);
    if (!file) return;

    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setSelectedFile(null);
      setUploadError(`Unsupported file type "${ext}". Allowed: .pdf, .docx, .epub, .txt, .md`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setUploadError("File exceeds 20 MB limit.");
      return;
    }
    setSelectedFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileValidation(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileValidation(file);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setUploadError("");
    setExtractionStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setUploadError("");
    setExtractionStatus(null);

    const ext = "." + selectedFile.name.split(".").pop().toLowerCase();

    try {
      if (ext === ".txt" || ext === ".md") {
        const rawText = await selectedFile.text();
        const trimmed = rawText.trim();
        const paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).slice(0, 15);
        const newDoc = {
          id: "local-" + Date.now(),
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          author: "Local Import",
          category: "User Uploaded Text",
          pages: Math.max(1, Math.ceil(trimmed.length / 1800)),
          estimatedMinutes: 3,
          dateAdded: new Date().toISOString().slice(0, 10),
          sourceType: "Local Text File",
          summary: paragraphs[0]?.slice(0, 160) || "",
          sections: paragraphs.map((p, i) => ({
            id: `local-sec-${i + 1}`,
            pageRef: `Section ${i + 1}`,
            heading: `Passage ${i + 1}`,
            originalText: p,
            translations: {},
            explanations: {},
          })),
        };
        onAddLocalDocument(newDoc);
        setExtractionStatus({ ok: true, text: `Successfully extracted text from "${selectedFile.name}". Added to library!` });
        setSelectedFile(null);
        setIsSubmitting(false);
        return;
      }

      const fileBase64 = await fileToBase64(selectedFile);
      if (ext === ".pdf") {
        const extractRes = await fetch("/api/extract-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: selectedFile.name, fileBase64 }),
        });
        const extractData = await extractRes.json();
        if (extractRes.ok && extractData.extracted && extractData.sections?.length > 0) {
          const newDoc = {
            id: "pdf-" + Date.now(),
            title: selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
            author: `Uploaded PDF (${formatBytes(selectedFile.size)})`,
            category: "User Uploaded PDF",
            pages: extractData.pageCount || extractData.sections.length,
            estimatedMinutes: extractData.estimatedMinutes || 5,
            dateAdded: new Date().toISOString().slice(0, 10),
            sourceType: "Server-Extracted PDF",
            summary: extractData.summary,
            sections: extractData.sections,
          };
          onAddLocalDocument(newDoc);
          setExtractionStatus({
            ok: true,
            text: `Extracted ${extractData.sections.length} pages from "${selectedFile.name}". Ready in library!`,
          });
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          setExtractionStatus({ ok: false, text: extractData.error || "Could not extract PDF text." });
        }
      }
    } catch (err) {
      setUploadError("Error processing file: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", boxSizing: "border-box" }}>
      
      {/* 1. Page Heading */}
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ 
          fontFamily: "var(--font-serif-reading)", 
          fontSize: "2.5rem", 
          fontWeight: 700, 
          color: "var(--text-primary)", 
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em"
        }}>
          My Documents & Local Upload
        </h1>
        <p style={{ fontSize: "1.0625rem", color: "var(--text-secondary)" }}>
          Access your uploaded files or browse our curated document library.
        </p>
      </header>

      {/* 2. Upload Area */}
      <section aria-labelledby="upload-heading" style={{ marginBottom: "3rem" }}>
        <div
          className={`upload-dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: "1px dashed var(--border-subtle)",
            borderRadius: "12px",
            padding: "3rem 1.5rem",
            textAlign: "center",
            background: "var(--bg-surface)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease"
          }}
        >
          <input
            ref={fileInputRef}
            id="document-file-input"
            type="file"
            accept=".pdf,.docx,.epub,.txt,.md"
            onChange={handleInputChange}
            style={{ display: "none" }}
          />
          <CloudUpload size={32} style={{ color: "#1E293B", marginBottom: "1rem" }} />
          <p style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Drag and drop a document here, or click to browse
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Supports .txt, .md, .pdf and .docx files. No file size limit. Files are stored locally in your browser.
          </p>
          <label 
            htmlFor="document-file-input" 
            className="btn btn-primary" 
            style={{ 
              cursor: "pointer", 
              background: "#1E293B", 
              color: "#FFF", 
              border: "none", 
              padding: "0.625rem 1.25rem", 
              borderRadius: "6px",
              fontWeight: 500 
            }}
          >
            <Upload size={16} style={{ marginRight: "0.5rem" }}/> Choose File
          </label>
        </div>

        {selectedFile && (
          <div style={{ marginTop: "1rem", padding: "1.25rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{selectedFile.name}</div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Type: {selectedFile.type || "Document"} • Size: {formatBytes(selectedFile.size)}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleProcessFile}
                disabled={isSubmitting}
                style={{ background: "#1E293B", color: "#FFF", border: "none" }}
              >
                {isSubmitting ? "Extracting..." : "Upload Document"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearSelection}
                disabled={isSubmitting}
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="notice-banner error" style={{ marginTop: "1rem" }}>
            <AlertCircle size={16} /><span>{uploadError}</span>
          </div>
        )}

        {extractionStatus && (
          <div className={`notice-banner ${extractionStatus.ok ? "success" : "warning"}`} style={{ marginTop: "1rem" }}>
            {extractionStatus.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{extractionStatus.text}</span>
          </div>
        )}
      </section>

      {/* 3. Document Library Controls & List */}
      <section aria-labelledby="library-list-heading">
        <h2 id="library-list-heading" style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
          Document Library ({filteredDocs.length})
        </h2>

        {/* Search and Dropdown Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "1rem", marginBottom: "1rem" }} className="library-controls-grid">
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="search"
              style={{ width: "100%", padding: "0.625rem 1rem 0.625rem 2.5rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", fontSize: "0.875rem" }}
              placeholder="Search documents by title, author, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            style={{ padding: "0.625rem 1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", fontSize: "0.875rem", minWidth: "180px", cursor: "pointer" }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Compact Category Chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            style={{
              padding: "0.375rem 1rem", borderRadius: "999px", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", border: "none",
              background: categoryFilter === "ALL" ? "#1E293B" : "var(--bg-subtle)",
              color: categoryFilter === "ALL" ? "#FFF" : "var(--text-secondary)",
              transition: "all 0.2s"
            }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: "0.375rem 1rem", borderRadius: "999px", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", border: "none",
                background: categoryFilter === cat ? "#1E293B" : "var(--bg-subtle)",
                color: categoryFilter === cat ? "#FFF" : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Document Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredDocs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", border: "1px dashed var(--border-subtle)", borderRadius: "12px", color: "var(--text-secondary)" }}>
              No documents match your search.
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const iconStyle = getFileIconStyle(doc.title, doc.category);
              return (
                <div
                  key={doc.id}
                  className="doc-row-card"
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    justifyContent: "space-between",
                    padding: "1.25rem",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    background: "var(--bg-surface)",
                    gap: "1.5rem",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", minWidth: 0, flex: 1 }}>
                    {/* Document File Icon */}
                    <div style={{ 
                      width: "48px", height: "56px", borderRadius: "8px", background: iconStyle.bg, color: iconStyle.color, 
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" 
                    }}>
                      <FileText size={24} />
                      <div style={{ fontSize: "0.6rem", fontWeight: 700, marginTop: "2px" }}>{iconStyle.text}</div>
                    </div>
                    
                    {/* Document Info */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.25rem" }}>
                        <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {doc.title}
                        </h3>
                        <div className="doc-row-tag" style={{ display: "inline-block", padding: "0.25rem 0.75rem", background: "var(--bg-subtle)", color: "var(--text-secondary)", fontSize: "0.75rem", borderRadius: "999px", flexShrink: 0, whiteSpace: "nowrap" }}>
                          {doc.category || "Document"}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <span>{doc.category || "Document"}</span>
                        <span>•</span>
                        <span>{doc.pages} pages</span>
                        <span>•</span>
                        <span>{iconStyle.text}</span>
                      </div>
                      
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                        {doc.summary}
                      </p>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="doc-row-actions" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0, gap: "1rem" }}>
                    <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "6px", background: "#1E293B", color: "#FFF", fontSize: "0.8125rem", fontWeight: 500, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                        onClick={() => onOpenDocument(doc.id, "reader")}
                      >
                        <BookOpen size={14} /> Read
                      </button>
                      <button
                        type="button"
                        style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1rem", borderRadius: "6px", background: "transparent", color: "var(--text-primary)", fontSize: "0.8125rem", fontWeight: 500, border: "1px solid var(--border-subtle)", cursor: "pointer", whiteSpace: "nowrap" }}
                        onClick={() => onOpenDocument(doc.id, "understand")}
                      >
                        <Sparkles size={14} /> Understand
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Responsive Styles Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .library-controls-grid { grid-template-columns: 1fr !important; }
          .doc-row-card { flex-direction: column !important; gap: 1rem !important; }
          .doc-row-actions { align-items: flex-start !important; flex-direction: row-reverse !important; width: 100%; justify-content: space-between !important; }
          .doc-row-actions > svg { display: none !important; }
          .doc-row-tag { display: none !important; }
        }
        @media (max-width: 480px) {
          .doc-row-actions div { width: 100%; }
          .doc-row-actions button { flex: 1; justify-content: center; }
        }
      `}} />
    </div>
  );
}
