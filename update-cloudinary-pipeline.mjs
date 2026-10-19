import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 1. Update package.json with cloudinary, unpdf (serverless PDF text extractor), and test script
const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.dependencies = pkg.dependencies || {};
pkg.dependencies.cloudinary = '^2.0.7';
pkg.dependencies.unpdf = '^0.12.1';
pkg.scripts = pkg.scripts || {};
pkg.scripts.test = 'node --test tests/backend-upload.test.mjs';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

// 2. Create vercel.json so /api/* routes are never swallowed by SPA fallback
const vercelConfig = {
  functions: {
    'api/*.js': {
      maxDuration: 15,
    },
  },
  rewrites: [
    { source: '/api/(.*)', destination: '/api/$1' },
  ],
};
fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2), 'utf8');

// 3. Create api/health.js — Safe Backend Health & Prerequisite Check
fs.mkdirSync('api', { recursive: true });
const healthHandlerCode = `export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
  const uploadAuthConfigured = Boolean(process.env.SEEHEAR_UPLOAD_AUTH_TOKEN);
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  const blockers = [];
  if (!cloudinaryConfigured) {
    blockers.push(
      'Missing server environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and/or CLOUDINARY_API_SECRET.'
    );
  }
  if (!uploadAuthConfigured) {
    blockers.push(
      'Missing authentication gate: Set SEEHEAR_UPLOAD_AUTH_TOKEN (or connect a production auth provider) to authorize private Cloudinary uploads.'
    );
  }
  if (!databaseConfigured) {
    blockers.push(
      'Missing persistent database (DATABASE_URL): Document ownership is not yet persisted in a relational/document database.'
    );
  }

  return res.status(200).json({
    status: 'ok',
    service: 'SeeHear Serverless Backend',
    capabilities: {
      pdfDigitalTextExtraction: true,
      scannedPdfOcr: Boolean(process.env.CLOUDINARY_OCR_ENABLED === 'true'),
      cloudinaryAuthenticatedUpload: cloudinaryConfigured && uploadAuthConfigured,
      persistentOwnershipDatabase: databaseConfigured,
    },
    blockers,
  });
}
`;
fs.writeFileSync('api/health.js', healthHandlerCode, 'utf8');

// 4. Create api/upload-document.js — Authenticated Private Cloudinary Upload Endpoint
const uploadHandlerCode = `import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = {
  '.pdf': {
    mimes: ['application/pdf'],
    magicHex: '255044462d', // %PDF-
  },
  '.docx': {
    mimes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
    ],
    magicHex: '504b0304', // PK.. (ZIP container)
  },
  '.epub': {
    mimes: ['application/epub+zip', 'application/octet-stream'],
    magicHex: '504b0304', // PK.. (ZIP container)
  },
};

function safeTimingEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Validate Payload Structure & File Constraints First
  const { fileName, mimeType, fileSize, fileBase64 } = req.body || {};

  if (!fileName || typeof fileName !== 'string' || !fileBase64 || typeof fileBase64 !== 'string') {
    return res.status(400).json({
      error: 'Validation Error: fileName and fileBase64 payload are required.',
    });
  }

  const ext = '.' + fileName.split('.').pop().toLowerCase();
  const spec = ALLOWED_TYPES[ext];
  if (!spec) {
    return res.status(400).json({
      error: \`Unsupported file format "\${ext}". Server allowlist permits only .pdf, .docx, and .epub.\`,
    });
  }

  if (mimeType && !spec.mimes.includes(mimeType)) {
    return res.status(400).json({
      error: \`Invalid MIME type "\${mimeType}" for extension "\${ext}".\`,
    });
  }

  const base64Clean = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
  let fileBuffer;
  try {
    fileBuffer = Buffer.from(base64Clean, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid Base64 encoding.' });
  }

  if (
    fileBuffer.byteLength === 0 ||
    fileBuffer.byteLength > MAX_UPLOAD_BYTES ||
    (typeof fileSize === 'number' && fileSize > MAX_UPLOAD_BYTES)
  ) {
    return res.status(413).json({
      error: \`File exceeds the maximum allowed size of 10 MB (received \${fileBuffer.byteLength} bytes).\`,
    });
  }

  const headerHex = fileBuffer.subarray(0, 5).toString('hex').toLowerCase();
  if (!headerHex.startsWith(spec.magicHex)) {
    return res.status(400).json({
      error: \`File signature mismatch: File content does not match expected binary header for \${ext}.\`,
    });
  }

  // 2. Enforce Authentication Gate (No Unrestricted Public Uploads)
  const expectedToken = process.env.SEEHEAR_UPLOAD_AUTH_TOKEN;
  const authHeader = req.headers?.authorization || '';
  const providedToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!expectedToken) {
    return res.status(503).json({
      error:
        'Cloudinary upload blocked: Authentication prerequisite (SEEHEAR_UPLOAD_AUTH_TOKEN / user auth session) is not configured on the server. Unrestricted public uploads are disabled by security policy.',
      blocker: 'MISSING_AUTH_PREREQUISITE',
    });
  }

  if (!providedToken || !safeTimingEqual(providedToken, expectedToken)) {
    return res.status(401).json({
      error:
        'Unauthorized (401): Missing or invalid Bearer token. Private Cloudinary storage requires an authenticated request.',
      blocker: 'UNAUTHORIZED_REQUEST',
    });
  }

  // 3. Verify Server-Side Cloudinary Credentials
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({
      error:
        'Server Configuration Incomplete: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be set in Vercel server-side Environment Variables.',
      blocker: 'MISSING_CLOUDINARY_ENV',
    });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  // 4. Server-Generated Asset Identifier & Authenticated Private Upload
  const serverAssetId = 'doc_' + crypto.randomUUID();
  const dataUri = \`data:\${spec.mimes[0]};base64,\${base64Clean}\`;

  try {
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'seehear_private_documents',
      public_id: serverAssetId,
      resource_type: 'raw',
      type: 'authenticated',
      access_mode: 'authenticated',
      overwrite: false,
      invalidate: true,
      context: {
        source: 'seehear_verified_upload',
        uploaded_at: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Document uploaded to Cloudinary with authenticated private access.',
      asset: {
        assetId: serverAssetId,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
        deliveryType: uploadResult.type,
        bytes: uploadResult.bytes,
        createdAt: uploadResult.created_at,
      },
      ownershipNote: process.env.DATABASE_URL
        ? 'Persisted to database.'
        : 'Asset stored privately in Cloudinary, but DATABASE_URL is not configured yet for persistent multi-user ownership mapping.',
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Cloudinary SDK upload failed on server.',
      details: err?.message || 'Unknown upstream error',
    });
  }
}
`;
fs.writeFileSync('api/upload-document.js', uploadHandlerCode, 'utf8');

// 5. Create api/extract-pdf.js — Dedicated Server-Side PDF Text Extraction Pipeline
const extractPdfHandlerCode = `import { extractText } from 'unpdf';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

const MAX_PDF_BYTES = 10 * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { fileName, fileBase64 } = req.body || {};
  if (!fileName || !fileBase64) {
    return res.status(400).json({ error: 'fileName and fileBase64 are required.' });
  }

  if (!fileName.toLowerCase().endsWith('.pdf')) {
    return res.status(400).json({ error: 'Only .pdf files are supported by /api/extract-pdf.' });
  }

  const base64Clean = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
  const pdfBuffer = Buffer.from(base64Clean, 'base64');

  if (pdfBuffer.byteLength === 0 || pdfBuffer.byteLength > MAX_PDF_BYTES) {
    return res.status(413).json({ error: 'PDF exceeds the 10 MB server extraction limit.' });
  }

  const headerHex = pdfBuffer.subarray(0, 5).toString('hex').toLowerCase();
  if (!headerHex.startsWith('255044462d')) {
    return res.status(400).json({ error: 'Invalid PDF file signature (%PDF- header missing).' });
  }

  try {
    const uint8 = new Uint8Array(pdfBuffer);
    const { totalPages, text } = await extractText(uint8, { mergePages: false });
    const pagesArray = Array.isArray(text) ? text : [String(text || '')];

    const sections = [];
    pagesArray.forEach((pageContent, idx) => {
      const cleaned = String(pageContent || '')
        .replace(/\\s+/g, ' ')
        .trim();
      if (cleaned.length > 0) {
        sections.push({
          id: \`pdf-page-\${idx + 1}\`,
          pageRef: \`Page \${idx + 1} of \${totalPages || pagesArray.length}\`,
          heading: \`Extracted Page \${idx + 1}\`,
          originalText: cleaned,
          translations: {},
          explanations: {},
        });
      }
    });

    if (sections.length === 0) {
      return res.status(200).json({
        extracted: false,
        isScannedImagePdf: true,
        pageCount: totalPages || pagesArray.length || 1,
        sections: [],
        message:
          'Server parsed the PDF structure (' +
          (totalPages || 1) +
          ' page(s)), but found 0 embedded digital text characters. This PDF appears to be a scanned image document and requires an OCR service (e.g., Cloudinary AI OCR add-on or Google Document AI) to extract text.',
      });
    }

    const totalWords = sections
      .map((s) => s.originalText)
      .join(' ')
      .split(/\\s+/).length;

    return res.status(200).json({
      extracted: true,
      isScannedImagePdf: false,
      pageCount: totalPages || sections.length,
      estimatedMinutes: Math.max(1, Math.ceil(totalWords / 200)),
      summary: sections[0].originalText.slice(0, 180) + (sections[0].originalText.length > 180 ? '...' : ''),
      sections,
      message: \`Server extracted digital text from \${sections.length} of \${totalPages || sections.length} page(s).\`,
    });
  } catch (err) {
    return res.status(422).json({
      error: 'Server PDF parser could not extract text from this file.',
      details: err?.message || 'Malformed or encrypted PDF stream.',
    });
  }
}
`;
fs.writeFileSync('api/extract-pdf.js', extractPdfHandlerCode, 'utf8');

// 6. Update vite.config.js so /api/* routes execute the real serverless handlers during local `npm run dev`
const viteConfigCode = `import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { pathToFileURL } from 'url';

function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        const routeName = req.url.split('?')[0].replace(/^\\/api\\//, '');
        const filePath = path.resolve(process.cwd(), 'api', routeName + '.js');

        let rawBody = '';
        req.on('data', (chunk) => {
          rawBody += chunk;
        });

        req.on('end', async () => {
          try {
            if (rawBody) {
              try {
                req.body = JSON.parse(rawBody);
              } catch {
                req.body = rawBody;
              }
            } else {
              req.body = {};
            }

            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
            res.json = (payload) => {
              if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
              }
              res.end(JSON.stringify(payload));
              return res;
            };

            const moduleUrl = pathToFileURL(filePath).href + '?t=' + Date.now();
            const mod = await import(moduleUrl);
            await mod.default(req, res);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: 'Local API Middleware Error',
                details: err?.message || String(err),
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  return {
    plugins: [react(), vercelApiDevPlugin()],
  };
});
`;
fs.writeFileSync('vite.config.js', viteConfigCode, 'utf8');

// 7. Update src/components/DocumentLibrary.jsx to call real /api/extract-pdf and /api/upload-document endpoints
const updatedDocLibraryCode = `import React, { useState, useRef } from 'react';
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
        \`Unsupported file type "\${ext}". Allowed formats: .pdf, .docx, .epub, .txt, or .md.\`
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
          .split(/\\n\\s*\\n/)
          .map((p) => p.trim())
          .filter(Boolean)
          .slice(0, 12);

        const newDoc = {
          id: 'local-' + Date.now(),
          title: selectedFile.name.replace(/\\.[^/.]+$/, ''),
          author: 'Local Text Import (' + selectedFile.name + ')',
          category: 'User Uploaded Document',
          pages: Math.max(1, Math.ceil(trimmed.length / 1800)),
          estimatedMinutes: Math.max(1, Math.ceil(trimmed.split(/\\s+/).length / 200)),
          dateAdded: new Date().toISOString().slice(0, 10),
          sourceType: 'Local Text File',
          summary: paragraphs[0]?.slice(0, 160) + (paragraphs[0]?.length > 160 ? '...' : ''),
          sections: paragraphs.map((para, idx) => ({
            id: \`local-sec-\${idx + 1}\`,
            pageRef: \`Section \${idx + 1}\`,
            heading: \`Passage \${idx + 1}\`,
            originalText: para,
            translations: {},
            explanations: {},
          })),
        };

        onAddLocalDocument(newDoc);
        setExtractionStatus({
          ok: true,
          text: \`Extracted \${paragraphs.length} passage(s) from "\${selectedFile.name}". Added to library below.\`,
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
            text: \`Server PDF Extraction Failed (\${extractRes.status}): \${extractData.error || 'Unable to parse PDF'}\`,
          });
        } else if (extractData.extracted && extractData.sections?.length > 0) {
          const newDoc = {
            id: 'pdf-' + Date.now(),
            title: selectedFile.name.replace(/\\.[^/.]+$/, ''),
            author: \`Uploaded PDF (\${selectedFile.name}, \${formatBytes(selectedFile.size)})\`,
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
            text: \`Server PDF Text Extraction Succeeded: \${extractData.message} "\${selectedFile.name}" has been added to your library below and can now be opened in the Reader.\`,
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
        headers['Authorization'] = \`Bearer \${authToken.trim()}\`;
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
          text: \`Cloudinary Storage Verified: Stored as authenticated asset "\${uploadData.asset.publicId}" (\${formatBytes(uploadData.asset.bytes)}). \${uploadData.ownershipNote || ''}\`,
        });
        if (!extractedDocCreated && ext !== '.pdf') {
          const metaDoc = {
            id: 'cloud-' + Date.now(),
            title: selectedFile.name.replace(/\\.[^/.]+$/, ''),
            author: \`Cloudinary Authenticated Asset (\${uploadData.asset.publicId})\`,
            category: 'User Uploaded Document',
            pages: 1,
            estimatedMinutes: 1,
            dateAdded: new Date().toISOString().slice(0, 10),
            sourceType: 'Cloudinary Stored (' + ext.toUpperCase().slice(1) + ')',
            summary: \`Stored in Cloudinary private folder (\${uploadData.asset.publicId}). Text parser for \${ext} is not enabled.\`,
            sections: [
              {
                id: 'cloud-sec-1',
                pageRef: 'Asset Metadata',
                heading: selectedFile.name,
                originalText: \`This file (\${selectedFile.name}) is stored in Cloudinary as an authenticated asset (\${uploadData.asset.publicId}).\`,
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
          text: \`Cloudinary Storage Status (HTTP \${uploadRes.status}): \${uploadData.error || 'Upload rejected'}\`,
        });
      }
    } catch (err) {
      setUploadError(\`Network or server error while processing file: \${err?.message || String(err)}\`);
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
          className={\`upload-dropzone \${isDragging ? 'dragging' : ''}\`}
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

            {!selectedFile.name.match(/\\.(txt|md)$/i) && (
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
            className={\`notice-banner \${extractionStatus.ok ? 'success' : 'warning'}\`}
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
            className={\`notice-banner \${cloudinaryStatus.ok ? 'success' : 'warning'}\`}
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
`;
fs.writeFileSync('src/components/DocumentLibrary.jsx', updatedDocLibraryCode, 'utf8');

// 8. Update .env.example with all required variables
const envExampleContent = `# SeeHear Server-Side Environment Variables (Configure in Vercel Project Settings)
# NEVER prefix these with VITE_ and NEVER commit real values to Git.

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Mandatory upload authorization secret until a full user authentication provider is connected
SEEHEAR_UPLOAD_AUTH_TOKEN=

# Optional database connection string for persistent user-document ownership
DATABASE_URL=
`;
fs.writeFileSync('.env.example', envExampleContent, 'utf8');

// 9. Create automated backend security & validation tests in tests/backend-upload.test.mjs
fs.mkdirSync('tests', { recursive: true });
const testCode = `import test from 'node:test';
import assert from 'node:assert/strict';
import healthHandler from '../api/health.js';
import uploadHandler from '../api/upload-document.js';
import extractPdfHandler from '../api/extract-pdf.js';

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

const VALID_MINIMAL_PDF_BASE64 = Buffer.from('%PDF-1.4\\n1 0 obj\\n<<>>\\nendobj\\n%%EOF', 'utf8').toString('base64');

test('GET /api/health reports configuration safely without exposing secrets', () => {
  const req = { method: 'GET' };
  const res = createMockRes();
  healthHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(typeof res.body.capabilities.pdfDigitalTextExtraction, 'boolean');
  assert.ok(Array.isArray(res.body.blockers));
});

test('POST /api/upload-document rejects unsupported file extensions (.exe)', async () => {
  const req = {
    method: 'POST',
    headers: {},
    body: {
      fileName: 'malware.exe',
      mimeType: 'application/x-msdownload',
      fileBase64: VALID_MINIMAL_PDF_BASE64,
    },
  };
  const res = createMockRes();
  await uploadHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Unsupported file format/);
});

test('POST /api/upload-document rejects spoofed PDF lacking %PDF- header', async () => {
  const req = {
    method: 'POST',
    headers: {},
    body: {
      fileName: 'spoofed.pdf',
      mimeType: 'application/pdf',
      fileBase64: Buffer.from('NOT_A_PDF_FILE').toString('base64'),
    },
  };
  const res = createMockRes();
  await uploadHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /File signature mismatch/);
});

test('POST /api/upload-document rejects oversized files (> 10 MB)', async () => {
  const req = {
    method: 'POST',
    headers: {},
    body: {
      fileName: 'large.pdf',
      mimeType: 'application/pdf',
      fileSize: 11 * 1024 * 1024,
      fileBase64: VALID_MINIMAL_PDF_BASE64,
    },
  };
  const res = createMockRes();
  await uploadHandler(req, res);
  assert.equal(res.statusCode, 413);
});

test('POST /api/upload-document blocks unauthenticated requests when SEEHEAR_UPLOAD_AUTH_TOKEN is set', async () => {
  process.env.SEEHEAR_UPLOAD_AUTH_TOKEN = 'test_secret_token_123';
  const req = {
    method: 'POST',
    headers: {},
    body: {
      fileName: 'Practice_Session_MidSem.pdf',
      mimeType: 'application/pdf',
      fileBase64: VALID_MINIMAL_PDF_BASE64,
    },
  };
  const res = createMockRes();
  await uploadHandler(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.blocker, 'UNAUTHORIZED_REQUEST');
});

test('POST /api/upload-document reports missing Cloudinary credentials when authenticated', async () => {
  process.env.SEEHEAR_UPLOAD_AUTH_TOKEN = 'test_secret_token_123';
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;

  const req = {
    method: 'POST',
    headers: { authorization: 'Bearer test_secret_token_123' },
    body: {
      fileName: 'Practice_Session_MidSem.pdf',
      mimeType: 'application/pdf',
      fileBase64: VALID_MINIMAL_PDF_BASE64,
    },
  };
  const res = createMockRes();
  await uploadHandler(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.blocker, 'MISSING_CLOUDINARY_ENV');
});

test('POST /api/extract-pdf rejects non-PDF payloads', async () => {
  const req = {
    method: 'POST',
    body: {
      fileName: 'fake.pdf',
      fileBase64: Buffer.from('hello world').toString('base64'),
    },
  };
  const res = createMockRes();
  await extractPdfHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /Invalid PDF file signature/);
});
`;
fs.writeFileSync('tests/backend-upload.test.mjs', testCode, 'utf8');

console.log('📦 Installing unpdf and verifying build + automated tests...');
execSync('npm install', { stdio: 'inherit' });
execSync('npm test', { stdio: 'inherit' });
execSync('npm run build', { stdio: 'inherit' });
console.log('✅ All backend routes, PDF extraction pipeline, tests, and production build succeeded!');
