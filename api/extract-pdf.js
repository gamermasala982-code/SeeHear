import { extractText } from 'unpdf';

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
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned.length > 0) {
        sections.push({
          id: `pdf-page-${idx + 1}`,
          pageRef: `Page ${idx + 1} of ${totalPages || pagesArray.length}`,
          heading: `Extracted Page ${idx + 1}`,
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
      .split(/\s+/).length;

    return res.status(200).json({
      extracted: true,
      isScannedImagePdf: false,
      pageCount: totalPages || sections.length,
      estimatedMinutes: Math.max(1, Math.ceil(totalWords / 200)),
      summary: sections[0].originalText.slice(0, 180) + (sections[0].originalText.length > 180 ? '...' : ''),
      sections,
      message: `Server extracted digital text from ${sections.length} of ${totalPages || sections.length} page(s).`,
    });
  } catch (err) {
    return res.status(422).json({
      error: 'Server PDF parser could not extract text from this file.',
      details: err?.message || 'Malformed or encrypted PDF stream.',
    });
  }
}
