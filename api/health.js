export default function handler(req, res) {
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
