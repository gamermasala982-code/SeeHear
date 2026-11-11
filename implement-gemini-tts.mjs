import fs from 'fs';
import { execSync } from 'child_process';

console.log("🎙️ Installing @google/genai SDK...");
try {
  execSync("npm install @google/genai", { stdio: "inherit" });
} catch(e) {
  console.log("⚠️ npm install failed, but proceeding...");
}

console.log("🎙️ Creating secure server-side /api/tts.js endpoint...");

const ttsApiCode = `import { GoogleGenAI } from '@google/genai';

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
    return res.status(400).json({ error: \`Language "\${language}" is not officially verified for this TTS model.\` });
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
`;

fs.writeFileSync('api/tts.js', ttsApiCode, 'utf8');

console.log("🎙️ Rewriting AudioPlayer.jsx for robust chunking and real playback...");

const audioPlayerCode = `import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Loader2, AlertCircle, Gauge } from "lucide-react";

// Safe text chunker to prevent sending overly long payloads & exceeding quotas
function chunkText(text, maxLen = 600) {
  if (!text) return [];
  // Split intelligently on sentence boundaries
  const sentences = text.match(/[^.!?\\n]+[.!?\\n]+/g) || [text];
  const chunks = [];
  let curr = "";
  for (const s of sentences) {
    if (curr.length + s.length < maxLen) {
      curr += s + " ";
    } else {
      if (curr.trim()) chunks.push(curr.trim());
      curr = s + " ";
    }
  }
  if (curr.trim()) chunks.push(curr.trim());
  return chunks.filter(Boolean);
}

export default function AudioPlayer({ textToSpeech, label, languageCode }) {
  const [playerState, setPlayerState] = useState("IDLE"); // IDLE, LOADING, PLAYING, PAUSED
  const [error, setError] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);

  const audioObjRef = useRef(null);
  const chunksRef = useRef([]);
  const currentChunkIndex = useRef(0);
  const abortControllerRef = useRef(null);

  // Stop playback and regenerate chunks if the text or language changes
  useEffect(() => {
    stopPlayback();
    chunksRef.current = chunkText(textToSpeech);
  }, [textToSpeech, languageCode]);

  // Clean up audio on unmount or navigation
  useEffect(() => {
    return () => stopPlayback();
  }, []);

  const stopPlayback = () => {
    if (audioObjRef.current) {
      audioObjRef.current.pause();
      audioObjRef.current.src = "";
      audioObjRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPlayerState("IDLE");
    setProgress(0);
    currentChunkIndex.current = 0;
  };

  const playChunk = async (index) => {
    if (index >= chunksRef.current.length) {
      setPlayerState("IDLE");
      setProgress(100);
      return;
    }

    setPlayerState("LOADING");
    setError(null);
    setProgress(Math.round((index / chunksRef.current.length) * 100));

    const chunk = chunksRef.current[index];
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chunk, language: languageCode }),
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate audio from Gemini.");
      }

      // Decode base64 to standard browser-playable source
      const audioSrc = "data:audio/wav;base64," + data.audioBase64;
      const audio = new Audio(audioSrc);
      audio.playbackRate = speed;
      audioObjRef.current = audio;

      // Automatically chain playback to the next chunk
      audio.onended = () => {
        currentChunkIndex.current += 1;
        playChunk(currentChunkIndex.current);
      };

      audio.onerror = () => {
        setError("Browser failed to decode the generated audio format.");
        setPlayerState("IDLE");
      };

      await audio.play();
      setPlayerState("PLAYING");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
      setPlayerState("IDLE");
    }
  };

  const handlePlay = () => {
    if (playerState === "PAUSED" && audioObjRef.current) {
      audioObjRef.current.play();
      setPlayerState("PLAYING");
    } else {
      playChunk(currentChunkIndex.current);
    }
  };

  const handlePause = () => {
    if (playerState === "PLAYING" && audioObjRef.current) {
      audioObjRef.current.pause();
      setPlayerState("PAUSED");
    }
  };

  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    if (audioObjRef.current) {
      audioObjRef.current.playbackRate = newSpeed;
    }
  };

  if (!textToSpeech) return null;

  return (
    <div style={{ background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
          Listen Aloud
        </h3>
        {playerState === "LOADING" && (
          <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Loader2 size={12} className="animate-spin" /> Generating AI Audio...
          </span>
        )}
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.4 }}>
        Powered by Gemini Flash-Lite TTS. {label ? \`Target: \${label}\` : ""}
      </p>

      {error && (
        <div className="notice-banner error" style={{ marginBottom: "1rem", padding: "0.5rem" }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "0.75rem" }}>{error}</span>
        </div>
      )}

      {/* Progress Indicator */}
      <div style={{ width: "100%", height: "4px", background: "var(--border-subtle)", borderRadius: "999px", marginBottom: "1.25rem", overflow: "hidden" }}>
        <div style={{ width: \`\${progress}%\`, height: "100%", background: "var(--accent-primary)", transition: "width 0.3s ease" }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
        {playerState === "PLAYING" ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePause} style={{ minWidth: "80px", justifyContent: "center" }}>
            <Pause size={14} /> Pause
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePlay} disabled={playerState === "LOADING"} style={{ minWidth: "80px", justifyContent: "center" }}>
            <Play size={14} /> {playerState === "PAUSED" ? "Resume" : "Play"}
          </button>
        )}

        <button type="button" className="btn btn-secondary btn-sm" onClick={stopPlayback} disabled={playerState === "IDLE"}>
          <Square size={14} /> Stop
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginLeft: "auto" }}>
          <Gauge size={14} style={{ color: "var(--text-muted)" }} />
          <select className="select-field" value={speed} onChange={handleSpeedChange} style={{ padding: "0.25rem 0.5rem", height: "auto", fontSize: "0.75rem", minWidth: "70px" }}>
            <option value="0.75">0.75x</option>
            <option value="1">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2.0x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/AudioPlayer.jsx', audioPlayerCode, 'utf8');

console.log("🎙️ Updating .env.example with GEMINI_API_KEY placeholders...");
let envExample = "";
if (fs.existsSync(".env.example")) {
  envExample = fs.readFileSync(".env.example", "utf8");
}
if (!envExample.includes("GEMINI_API_KEY")) {
  envExample += "\n# Google Gemini TTS Configuration\nGEMINI_API_KEY=your_google_gemini_api_key_here\nGEMINI_TTS_MODEL=gemini-3.8-flash-lite-tts\n";
  fs.writeFileSync(".env.example", envExample, "utf8");
}

console.log("🔨 Running production build to verify integration...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build passed successfully!");
} catch(err) {
  console.error("❌ Build failed:", err.message);
}
