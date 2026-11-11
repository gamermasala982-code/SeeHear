import React, { useState, useEffect } from "react";

const GROQ_KEY = "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";

export default function NarrationPage() {
  const [inputText, setInputText] = useState(
    "Article 21 of the Constitution of India states: No person shall be deprived of his life or personal liberty except according to procedure established by law."
  );
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordDefinition, setWordDefinition] = useState("");
  const [isDefining, setIsDefining] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const synthRef = window.speechSynthesis;

  useEffect(() => {
    const split = inputText
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 3);
    setSentences(split.length > 0 ? split : [inputText]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    if (synthRef) synthRef.cancel();
  }, [inputText]);

  const speakSentence = (index) => {
    if (!synthRef || index >= sentences.length) {
      setIsPlaying(false);
      return;
    }
    synthRef.cancel();
    setCurrentIndex(index);
    setIsPlaying(true);

    const utter = new SpeechSynthesisUtterance(sentences[index]);
    utter.rate = rate;
    utter.onend = () => {
      if (index + 1 < sentences.length) {
        speakSentence(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentIndex(-1);
      }
    };
    utter.onerror = () => setIsPlaying(false);
    synthRef.speak(utter);
  };

  const togglePlay = () => {
    if (isPlaying) {
      synthRef.pause();
      setIsPlaying(false);
    } else {
      if (synthRef.paused) {
        synthRef.resume();
        setIsPlaying(true);
      } else {
        speakSentence(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  };

  const stopNarration = () => {
    if (synthRef) synthRef.cancel();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  const lookupWord = async (word) => {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (!clean) return;
    setSelectedWord(clean);
    setIsDefining(true);
    setWordDefinition("");
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            { role: "system", content: `Explain the word "${clean}" simply in 1 short sentence.` },
            { role: "user", content: `Define: ${clean}` }
          ],
          temperature: 0.3
        })
      });
      const data = await res.json();
      setWordDefinition(data.choices?.[0]?.message?.content || "Definition not found.");
    } catch {
      setWordDefinition("Could not fetch definition.");
    } finally {
      setIsDefining(false);
    }
  };

  const askAboutSentence = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setIsAsking(true);
    setChatAnswer("");
    try {
      const activeContextSentence = currentIndex >= 0 ? sentences[currentIndex] : sentences[0];
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            { role: "system", content: `You are an AI study tutor. Answer the user's question about this sentence: "${activeContextSentence}". Keep it concise.` },
            { role: "user", content: question }
          ],
          temperature: 0.3
        })
      });
      const data = await res.json();
      setChatAnswer(data.choices?.[0]?.message?.content || "No answer generated.");
    } catch {
      setChatAnswer("Error getting answer from AI.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px", fontFamily: "sans-serif" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#0f172a" }}>🎙️ Live Narration Studio</h1>
        <p style={{ fontSize: "13px", color: "#64748b" }}>Synchronized audio narration, sentence highlighting, word lookups, and AI tutoring.</p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#475569" }}>Text Content to Narrate</label>
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={togglePlay} style={{ padding: "6px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>
            {isPlaying ? "⏸ Pause" : "▶ Play Narration"}
          </button>
          <button onClick={stopNarration} style={{ padding: "6px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>
            ⏹ Stop
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#475569" }}>Speed:</span>
          <select value={rate} onChange={(e) => { setRate(parseFloat(e.target.value)); if (isPlaying) synthRef.cancel(); }} style={{ padding: "4px 6px", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "11px" }}>
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
          </select>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
        <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#64748b", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
          Interactive Sentences (Click to Rehear)
        </div>
        {sentences.map((sent, idx) => {
          const active = idx === currentIndex;
          return (
            <div
              key={idx}
              onClick={() => speakSentence(idx)}
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                background: active ? "#fef3c7" : "#f8fafc",
                borderLeft: active ? "4px solid #f59e0b" : "4px solid transparent",
                fontSize: "12.5px",
                lineHeight: "1.5",
                color: active ? "#451a03" : "#334155",
                fontWeight: active ? "600" : "400"
              }}
            >
              {sent.split(" ").map((word, wIdx) => (
                <span
                  key={wIdx}
                  onClick={(e) => { e.stopPropagation(); lookupWord(word); }}
                  style={{ marginRight: "4px", cursor: "pointer", borderBottom: selectedWord === word.replace(/[^a-zA-Z]/g, "") ? "1px dashed #2563eb" : "none" }}
                >
                  {word}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {selectedWord && (
        <div style={{ padding: "10px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#1e40af", marginBottom: "4px" }}>
            <span>📖 Word Lookup: "{selectedWord}"</span>
            <span style={{ cursor: "pointer", color: "#64748b" }} onClick={() => setSelectedWord(null)}>✕</span>
          </div>
          <div style={{ color: "#1e293b" }}>{isDefining ? "⏳ Defining..." : wordDefinition}</div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#475569" }}>💬 Pause & Ask AI About Sentence</span>
        <form onSubmit={askAboutSentence} style={{ display: "flex", gap: "6px" }}>
          <input
            type="text"
            placeholder="Ask question about active sentence..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ flex: 1, padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
          />
          <button type="submit" disabled={isAsking} style={{ padding: "6px 14px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
            {isAsking ? "..." : "Ask"}
          </button>
        </form>
        {chatAnswer && (
          <div style={{ padding: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "12px", color: "#1e293b" }}>
            <b>AI Tutor:</b> {chatAnswer}
          </div>
        )}
      </div>
    </div>
  );
}
