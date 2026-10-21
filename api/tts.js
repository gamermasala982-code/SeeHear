import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, language } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for speech generation.' });
  }

  // 1. Secure API Configuration (Server-Side Only)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is missing from server environment variables.' });
  }

  // 2. Strict Language Validation
  const supportedLangs = ['en', 'hi', 'hinglish'];
  if (!supportedLangs.includes(language)) {
    return res.status(400).json({ error: `Language "${language}" is not officially verified for this TTS model.` });
  }

  // 3. Model & Voice Configuration
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  try {
    const interaction = await ai.interactions.create({
      model,
      input: [{
        type: 'user_input',
        content: [{ type: 'text', text: text.slice(0, 1500) }] // Safeguard against overly long single chunks
      }],
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: {
          speakers: [ { speaker: "Narrator", voice: "Kore" } ]
        }
      }
    });

    const audioData = interaction.output_audio?.data || interaction.steps?.[0]?.content?.[0]?.data;
    if (!audioData) {
      throw new Error("No audio data found in Gemini API response.");
    }

    return res.status(200).json({
      success: true,
      audioBase64: audioData,
      modelUsed: model
    });
  } catch (err) {
    console.error("Gemini TTS Error:", err);
    // Safe error return without leaking stack traces or keys
    return res.status(502).json({ error: 'TTS generation failed: ' + (err.message || "Provider error") });
  }
}
