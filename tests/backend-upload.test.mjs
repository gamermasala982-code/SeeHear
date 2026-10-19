import test from 'node:test';
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

const VALID_MINIMAL_PDF_BASE64 = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF', 'utf8').toString('base64');

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
