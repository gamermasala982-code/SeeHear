import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function DocumentLibrary({
  documents,
  onAddLocalDocument,
  onOpenDocument,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadInfo, setUploadInfo] = useState('');
  const [simulatingProgress, setSimulatingProgress] = useState(false);
  const fileInputRef = useRef(null);

  const categories = ['ALL', ...Array.from(new Set(documents.map((d) => d.category)))];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
    const matchesQuery =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const handleFileValidation = (file) => {
    setUploadError('');
    setUploadInfo('');
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setSelectedFile(null);
      setUploadError(
        `Unsupported file type "${ext}". Please select a .txt, .md, .pdf, .doc, or .docx file.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setUploadError('Selected file exceeds the 10 MB local browser inspection limit.');
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
    setUploadError('');
    setUploadInfo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessFile = () => {
    if (!selectedFile) return;
    setSimulatingProgress(true);
    setUploadError('');
    setUploadInfo('');

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();

    if (ext === '.txt' || ext === '.md') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawText = String(event.target?.result || '').trim();
        setTimeout(() => {
          setSimulatingProgress(false);
          if (!rawText) {
            setUploadError('The selected text file appears to be empty.');
            return;
          }
          const paragraphs = rawText
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
            .slice(0, 6);

          const newDoc = {
            id: 'local-' + Date.now(),
            title: selectedFile.name.replace(/\.[^/.]+$/, ''),
            author: 'Local Browser FileReader Import',
            category: 'User Uploaded Text',
            pages: Math.max(1, Math.ceil(rawText.length / 1800)),
            estimatedMinutes: Math.max(2, Math.ceil(rawText.split(/\s+/).length / 200)),
            dateAdded: new Date().toISOString().slice(0, 10),
            sourceType: 'Local Browser Text File',
            summary: paragraphs[0]?.slice(0, 160) + (paragraphs[0]?.length > 160 ? '...' : ''),
            sections: paragraphs.map((para, idx) => ({
              id: `local-sec-${idx + 1}`,
              pageRef: `Extracted Block ${idx + 1}`,
              heading: `Section ${idx + 1}`,
              originalText: para,
              translations: {},
              explanations: {},
            })),
          };

          onAddLocalDocument(newDoc);
          setUploadInfo(
            `Extracted ${paragraphs.length} passage(s) locally in your browser from "${selectedFile.name}". No file was sent to a remote server.`
          );
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 450);
      };
      reader.onerror = () => {
        setSimulatingProgress(false);
        setUploadError('Browser FileReader could not read the selected file.');
      };
      reader.readAsText(selectedFile);
    } else {
      // Honest limitation for binary PDF/DOCX without backend parser
      setTimeout(() => {
        setSimulatingProgress(false);
        setUploadInfo(
          `File "${selectedFile.name}" (${formatBytes(
            selectedFile.size
          )}) was verified locally. Because this frontend demo runs without a backend OCR/PDF parser or remote Cloudinary upload server, binary PDF/DOCX contents are not extracted in-browser. You can upload plain .txt/.md files for live local extraction or open the verified multi-section sample documents below.`
        );
      }, 500);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">My Documents & Local Upload</h1>
          <p className="page-subtitle">
            Inspect local files in-browser or open verified multilingual sample documents.
          </p>
        </div>
      </header>

      {/* Honest File Upload Box */}
      <section aria-labelledby="upload-heading" style={{ marginBottom: '2.25rem' }}>
        <h2 id="upload-heading" className="section-heading">
          <span>Add Document from Your Device (Local Browser Workflow)</span>
        </h2>

        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="document-file-input"
            type="file"
            accept=".txt,.md,.pdf,.doc,.docx"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <Upload size={28} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
            Drag and drop a document here, or browse from your computer
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Supports <code>.txt</code> and <code>.md</code> for full browser-side text extraction. Binary <code>.pdf</code> and <code>.docx</code> files are validated with honest frontend-only scope feedback.
          </p>
          <label htmlFor="document-file-input" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            Choose File
          </label>
        </div>

        {selectedFile && (
          <div className="surface-card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{selectedFile.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Type: {selectedFile.type || 'Document'} • Size: {formatBytes(selectedFile.size)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleProcessFile}
                  disabled={simulatingProgress}
                >
                  {simulatingProgress ? 'Inspecting Locally (Frontend Simulation)...' : 'Inspect & Load Locally'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearSelection}
                  disabled={simulatingProgress}
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="notice-banner error" role="alert" style={{ marginTop: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadInfo && (
          <div className="notice-banner success" role="status" style={{ marginTop: '1rem' }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{uploadInfo}</span>
          </div>
        )}
      </section>

      {/* Filter & Search Bar */}
      <section aria-labelledby="library-list-heading">
        <div className="section-heading">
          <span id="library-list-heading">Document Library ({filteredDocs.length})</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="search"
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by title, author, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search documents in library"
            />
          </div>

          <select
            className="select-field"
            style={{ width: 'auto', minWidth: '200px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter documents by subject category"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="surface-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              No documents match your current search or filter criteria.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {filteredDocs.map((doc) => (
              <article key={doc.id} className="surface-card">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="meta-tag">{doc.category}</span>
                    <span className="meta-tag">{doc.sourceType}</span>
                  </div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {doc.title}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
                    {doc.author} • {doc.pages} pages • Added {doc.dateAdded}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    {doc.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenDocument(doc.id, 'reader')}
                  >
                    <BookOpen size={14} />
                    <span>Read</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenDocument(doc.id, 'understand')}
                  >
                    <Sparkles size={14} />
                    <span>Understand</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
