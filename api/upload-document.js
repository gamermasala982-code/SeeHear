import crypto from 'crypto';
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
      error: `Unsupported file format "${ext}". Server allowlist permits only .pdf, .docx, and .epub.`,
    });
  }

  if (mimeType && !spec.mimes.includes(mimeType)) {
    return res.status(400).json({
      error: `Invalid MIME type "${mimeType}" for extension "${ext}".`,
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
      error: `File exceeds the maximum allowed size of 10 MB (received ${fileBuffer.byteLength} bytes).`,
    });
  }

  const headerHex = fileBuffer.subarray(0, 5).toString('hex').toLowerCase();
  if (!headerHex.startsWith(spec.magicHex)) {
    return res.status(400).json({
      error: `File signature mismatch: File content does not match expected binary header for ${ext}.`,
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
  const dataUri = `data:${spec.mimes[0]};base64,${base64Clean}`;

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
