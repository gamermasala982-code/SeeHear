import React, { useState, useEffect, useRef } from "react";

const GROQ_KEY = "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";

export default function NarrationPage() {
  const [inputText, setInputText] = useState(
    "Article 21 of the Constitution of India states: No person shall be deprived of his life or personal liberty except according to procedure established by law. In early jurisprudence, notably A.P. Gopalan v. State of Madras (1950), the Supreme Court interpreted procedure established by law literally, meaning any enacted statutory procedure sufficed."
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
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#0f172a", marginBottom: "6px" }}>🎙️ Live Narration & Study Assistant</h1>
        <p style={{ fontSize: "14px", color: "#64748b" }}>Listen to synchronized text narration, click any sentence to rehear, lookup difficult words instantly, and pause to ask AI.</p>
      </div>

      {/* Input Source Box */}
      <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <label style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#475569" }}>Study Text / Document Content</label>
        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste or type text to narrate..."
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", lineHeight: "1.5", resize: "vertical" }}
        />
      </div>

      {/* Audio Controller Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "14px 18px", borderRadius: "10px", border: "1px solid #cbd5e1" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={togglePlay} style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
            {isPlaying ? "⏸ Pause Narration" : "▶ Start Narration"}
          </button>
          <button onClick={stopNarration} style={{ padding: "8px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}>
            ⏹ Stop
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "bold", color: "#475569" }}>Narration Speed:</span>
          <select value={rate} onChange={(e) => { setRate(parseFloat(e.target.value)); if (isPlaying) synthRef.cancel(); }} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}>
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x (Normal)</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
          </select>
        </div>
      </div>

      {/* Synchronized Sentence Viewer */}
      <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#64748b", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
          Synchronized Sentence Stream (Click any sentence to jump & rehear)
        </div>
        {sentences.map((sent, idx) => {
          const active = idx === currentIndex;
          return (
            <div
              key={idx}
              onClick={() => speakSentence(idx)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                background: active ? "#fef3c7" : "#f8fafc",
                borderLeft: active ? "4px solid #f59e0b" : "4px solid transparent",
                fontSize: "13.5px",
                lineHeight: "1.6",
                color: active ? "#451a03" : "#334155",
                fontWeight: active ? "600" : "400",
                transition: "all 0.2s ease"
              }}
            >
              {sent.split(" ").map((word, wIdx) => (
                <span
                  key={wIdx}
                  onClick={(e) => { e.stopPropagation(); lookupWord(word); }}
                  style={{ marginRight: "5px", cursor: "pointer", borderBottom: selectedWord === word.replace(/[^a-zA-Z]/g, "") ? "1px dashed #2563eb" : "none" }}
                >
                  {word}
                </span>
              ))}
            </div>
          );
        })}
      </div>

      {/* Word Instant Definition Box */}
      {selectedWord && (
        <div style={{ padding: "14px 18px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", fontSize: "13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: "#1e40af", marginBottom: "6px" }}>
            <span>📖 Word Lookup: "{selectedWord}"</span>
            <span style={{ cursor: "pointer", color: "#64748b" }} onClick={() => setSelectedWord(null)}>✕</span>
          </div>
          <div style={{ color: "#1e293b", lineHeight: "1.5" }}>{isDefining ? "⏳ Defining..." : wordDefinition}</div>
        </div>
      )}

      {/* Pause & Ask AI Panel */}
      <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <span style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", color: "#475569" }}>💬 Pause & Ask AI Tutor About Active Sentence</span>
        <form onSubmit={askAboutSentence} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Ask a question about the sentence currently being narrated..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
          <button type="submit" disabled={isAsking} style={{ padding: "8px 18px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}>
            {isAsking ? "Thinking..." : "Ask AI"}
          </button>
        </form>
        {chatAnswer && (
          <div style={{ padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", color: "#1e293b", lineHeight: "1.5" }}>
            <b>AI Tutor:</b> {chatAnswer}
          </div>
        )}
      </div>
    </div>
  );
}
