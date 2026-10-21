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

  // Secure API Configuration (Server-Side Only)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is missing from server environment variables.' });
  }

  // Model Configuration
  const modelName = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts';
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  try {
    // Official Single-Speaker GenerateContent Request
    const response = await ai.models.generateContent({
      model: modelName,
      contents: text.slice(0, 1500), // Protect against overly long chunks
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

    // Extract base64 audio payload from inlineData
    const part = response.candidates?.[0]?.content?.parts?.[0];
    const audioData = part?.inlineData?.data || part?.inline_data?.data;

    if (!audioData) {
      throw new Error("No audio data returned in Gemini API response.");
    }

    return res.status(200).json({
      success: true,
      audioBase64: audioData,
      modelUsed: modelName
    });
  } catch (err) {
    console.error("Gemini TTS Error:", err);
    // Return honest failure to frontend without leaking keys
    return res.status(502).json({ error: 'TTS generation failed: ' + (err.message || "Provider error") });
  }
}
