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
    return res.status(400).json({ error: `Language "${language}" is not officially supported.` });
  }

  // 3. Model Configuration
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  try {
    // 4. Official Single-Speaker GenerateContent Request
    const response = await ai.models.generateContent({
      model: model,
      contents: text.slice(0, 1500), // Protected chunk limit
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Aoede" // Official, clear, neutral single-speaker voice
            }
          }
        }
      }
    });

    // 5. Extract actual audio payload (supports standard inlineData formats)
    const part = response.candidates?.[0]?.content?.parts?.[0];
    const audioData = part?.inlineData?.data || part?.inline_data?.data;

    if (!audioData) {
      throw new Error("No audio data returned in Gemini API response.");
    }

    return res.status(200).json({
      success: true,
      audioBase64: audioData,
      modelUsed: model
    });
  } catch (err) {
    console.error("Gemini TTS Error:", err);
    // Return honest failure to frontend without leaking keys
    return res.status(502).json({ error: 'TTS generation failed: ' + (err.message || "Provider error") });
  }
}
