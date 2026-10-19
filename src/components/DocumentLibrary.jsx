import React, { useState, useRef } from 'react';
import {
  Upload,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  BookOpen,
  Sparkles,
  KeyRound,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx', '.epub'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Browser FileReader failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export default function DocumentLibrary({
  documents,
  onAddLocalDocument,
  onOpenDocument,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [extractionStatus, setExtractionStatus] = useState(null);
  const [cloudinaryStatus, setCloudinaryStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setExtractionStatus(null);
    setCloudinaryStatus(null);
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setSelectedFile(null);
      setUploadError(
        `Unsupported file type "${ext}". Allowed formats: .pdf, .docx, .epub, .txt, or .md.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setUploadError('Selected file exceeds the 10 MB server limit.');
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
    setExtractionStatus(null);
    setCloudinaryStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    setUploadError('');
    setExtractionStatus(null);
    setCloudinaryStatus(null);

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();

    try {
      // Plain text / Markdown files
      if (ext === '.txt' || ext === '.md') {
        const rawText = await selectedFile.text();
        const trimmed = rawText.trim();
        if (!trimmed) {
          setUploadError('The selected text file is empty.');
          setIsSubmitting(false);
          return;
        }
        const paragraphs = trimmed
          .split(/\n\s*\n/)
          .map((p) => p.trim())
          .filter(Boolean)
          .slice(0, 12);

        const newDoc = {
          id: 'local-' + Date.now(),
          title: selectedFile.name.replace(/\.[^/.]+$/, ''),
          author: 'Local Text Import (' + selectedFile.name + ')',
          category: 'User Uploaded Document',
          pages: Math.max(1, Math.ceil(trimmed.length / 1800)),
          estimatedMinutes: Math.max(1, Math.ceil(trimmed.split(/\s+/).length / 200)),
          dateAdded: new Date().toISOString().slice(0, 10),
          sourceType: 'Local Text File',
          summary: paragraphs[0]?.slice(0, 160) + (paragraphs[0]?.length > 160 ? '...' : ''),
          sections: paragraphs.map((para, idx) => ({
            id: `local-sec-${idx + 1}`,
            pageRef: `Section ${idx + 1}`,
            heading: `Passage ${idx + 1}`,
            originalText: para,
            translations: {},
            explanations: {},
          })),
        };

        onAddLocalDocument(newDoc);
        setExtractionStatus({
          ok: true,
          text: `Extracted ${paragraphs.length} passage(s) from "${selectedFile.name}". Added to library below.`,
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsSubmitting(false);
        return;
      }

      // Binary documents (.pdf, .docx, .epub): convert to Base64 and call real serverless APIs
      const fileBase64 = await fileToBase64(selectedFile);
      let extractedDocCreated = false;

      // Step A: If PDF, call dedicated server-side PDF text extraction pipeline (/api/extract-pdf)
      if (ext === '.pdf') {
        const extractRes = await fetch('/api/extract-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileBase64,
          }),
        });
        const extractData = await extractRes.json();

        if (!extractRes.ok) {
          setExtractionStatus({
            ok: false,
            text: `Server PDF Extraction Failed (${extractRes.status}): ${extractData.error || 'Unable to parse PDF'}`,
          });
        } else if (extractData.extracted && extractData.sections?.length > 0) {
          const newDoc = {
            id: 'pdf-' + Date.now(),
            title: selectedFile.name.replace(/\.[^/.]+$/, ''),
            author: `Uploaded PDF (${selectedFile.name}, ${formatBytes(selectedFile.size)})`,
            category: 'User Uploaded PDF',
            pages: extractData.pageCount || extractData.sections.length,
            estimatedMinutes: extractData.estimatedMinutes || 3,
            dateAdded: new Date().toISOString().slice(0, 10),
            sourceType: 'Server-Extracted PDF',
            summary: extractData.summary,
            sections: extractData.sections,
          };
          onAddLocalDocument(newDoc);
          extractedDocCreated = true;
          setExtractionStatus({
            ok: true,
            text: `Server PDF Text Extraction Succeeded: ${extractData.message} "${selectedFile.name}" has been added to your library below and can now be opened in the Reader.`,
          });
        } else {
          setExtractionStatus({
            ok: false,
            text: extractData.message || 'No digital text layer found in PDF (OCR required).',
          });
        }
      }

      // Step B: Call authenticated Cloudinary storage endpoint (/api/upload-document)
      const headers = { 'Content-Type': 'application/json' };
      if (authToken.trim()) {
        headers['Authorization'] = `Bearer ${authToken.trim()}`;
      }

      const uploadRes = await fetch('/api/upload-document', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type || (ext === '.pdf' ? 'application/pdf' : 'application/octet-stream'),
          fileSize: selectedFile.size,
          fileBase64,
        }),
      });

      const uploadData = await uploadRes.json();

      if (uploadRes.ok && uploadData.success) {
        setCloudinaryStatus({
          ok: true,
          text: `Cloudinary Storage Verified: Stored as authenticated asset "${uploadData.asset.publicId}" (${formatBytes(uploadData.asset.bytes)}). ${uploadData.ownershipNote || ''}`,
        });
        if (!extractedDocCreated && ext !== '.pdf') {
          const metaDoc = {
            id: 'cloud-' + Date.now(),
            title: selectedFile.name.replace(/\.[^/.]+$/, ''),
            author: `Cloudinary Authenticated Asset (${uploadData.asset.publicId})`,
            category: 'User Uploaded Document',
            pages: 1,
            estimatedMinutes: 1,
            dateAdded: new Date().toISOString().slice(0, 10),
            sourceType: 'Cloudinary Stored (' + ext.toUpperCase().slice(1) + ')',
            summary: `Stored in Cloudinary private folder (${uploadData.asset.publicId}). Text parser for ${ext} is not enabled.`,
            sections: [
              {
                id: 'cloud-sec-1',
                pageRef: 'Asset Metadata',
                heading: selectedFile.name,
                originalText: `This file (${selectedFile.name}) is stored in Cloudinary as an authenticated asset (${uploadData.asset.publicId}).`,
                translations: {},
                explanations: {},
              },
            ],
          };
          onAddLocalDocument(metaDoc);
        }
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setCloudinaryStatus({
          ok: false,
          text: `Cloudinary Storage Status (HTTP ${uploadRes.status}): ${uploadData.error || 'Upload rejected'}`,
        });
      }
    } catch (err) {
      setUploadError(`Network or server error while processing file: ${err?.message || String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">My Documents & Backend Upload</h1>
          <p className="page-subtitle">
            Upload PDFs for server-side text extraction and authenticated Cloudinary storage, or explore built-in multilingual study packs.
          </p>
        </div>
      </header>

      <section aria-labelledby="upload-heading" style={{ marginBottom: '2.25rem' }}>
        <h2 id="upload-heading" className="section-heading">
          <span>Upload Document (Server PDF Extraction + Cloudinary Storage)</span>
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
            accept=".pdf,.docx,.epub,.txt,.md"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <Upload size={28} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
            Drag and drop a PDF, DOCX, EPUB, TXT, or MD file here
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Digital <code>.pdf</code> files are parsed server-side via <code>/api/extract-pdf</code> and sent to <code>/api/upload-document</code> for authenticated Cloudinary storage (max 10 MB).
          </p>
          <label htmlFor="document-file-input" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            Choose File
          </label>
        </div>

        {selectedFile && (
          <div className="surface-card" style={{ marginTop: '1rem', gap: '0.875rem' }}>
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Uploading & Extracting on Server...' : 'Upload & Extract via Server'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearSelection}
                  disabled={isSubmitting}
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            {!selectedFile.name.match(/\.(txt|md)$/i) && (
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                <KeyRound size={15} style={{ color: 'var(--text-muted)' }} />
                <label htmlFor="upload-auth-token" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Upload Bearer Token (matches server <code>SEEHEAR_UPLOAD_AUTH_TOKEN</code>):
                </label>
                <input
                  id="upload-auth-token"
                  type="password"
                  className="input-field"
                  style={{ maxWidth: '280px', padding: '0.3125rem 0.625rem', fontSize: '0.8125rem' }}
                  placeholder="Optional token for Cloudinary storage..."
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {uploadError && (
          <div className="notice-banner error" role="alert" style={{ marginTop: '1rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{uploadError}</span>
          </div>
        )}

        {extractionStatus && (
          <div
            className={`notice-banner ${extractionStatus.ok ? 'success' : 'warning'}`}
            role="status"
            style={{ marginTop: '1rem' }}
          >
            {extractionStatus.ok ? (
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <span>{extractionStatus.text}</span>
          </div>
        )}

        {cloudinaryStatus && (
          <div
            className={`notice-banner ${cloudinaryStatus.ok ? 'success' : 'warning'}`}
            role="status"
            style={{ marginTop: '0.75rem' }}
          >
            {cloudinaryStatus.ok ? (
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <span>{cloudinaryStatus.text}</span>
          </div>
        )}
      </section>

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

        <div className="grid-3">
          {filteredDocs.map((doc) => (
            <article key={doc.id} className="surface-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="meta-tag">{doc.category}</span>
                  <span className="meta-tag">{doc.sourceType}</span>
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {doc.title}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
                  {doc.author} • {doc.pages} page(s) • Added {doc.dateAdded}
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
      </section>
    </div>
  );
}
