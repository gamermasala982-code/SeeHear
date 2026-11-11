import React, { useState, useEffect } from "react";

const GROQ_KEY = "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";

export default function SmartHighlightsPanel({ pageText = "", activeLanguage = "English" }) {
  const storageKey = `seehear_highlights_v1`;
  const [highlights, setHighlights] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || []; }
    catch { return []; }
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(highlights));
  }, [highlights]);

  const getActiveGroqModel = async () => {
    const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${GROQ_KEY}` }
    });
    const modelsData = await modelsRes.json();
    const list = (modelsData.data || []).map(m => m.id);
    // Strictly filter out audio, guard, embeddings, or preview models
    const validModels = list.filter(id =>
      !id.includes("guard") &&
      !id.includes("whisper") &&
      !id.includes("tts") &&
      !id.includes("audio") &&
      !id.includes("orpheus") &&
      !id.includes("embedding")
    );
    return validModels.find(id => id.includes("llama-3.3") || id.includes("llama-3.1") || id.includes("llama3")) ||
           validModels.find(id => id.includes("mixtral") || id.includes("gemma")) ||
           validModels[0] || "llama-3.1-70b-versatile";
  };

  const generateHighlights = async () => {
    setIsGenerating(true);
    try {
      let textToSummarize = pageText;
      if (!textToSummarize || textToSummarize.length < 40) {
        const allText = Array.from(document.querySelectorAll("p, h1, h2, h3, article, main"))
          .map(el => el.innerText?.trim())
          .filter(t => t && t.length > 25 && !t.includes("Smart Highlights"))
          .join("\n");
        textToSummarize = allText.slice(0, 3500);
      }

      if (!textToSummarize || textToSummarize.length < 30) {
        throw new Error("Could not detect enough text on the page to highlight.");
      }

      const activeModel = await getActiveGroqModel();

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
          model: activeModel,
          messages: [
            {
              role: "system",
              content: `You are an AI reader that extracts the most important sentences and facts from text. Return a JSON object with a single key "highlights" containing an array of 4 to 6 strings. Write in ${activeLanguage} (if Hinglish, use Roman script). Keep them concise and impactful. Format: JSON ONLY.`
            },
            { role: "user", content: `Extract core highlights from this text:\n\n${textToSummarize}` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
      if (parsed.highlights && Array.isArray(parsed.highlights)) {
        setHighlights(parsed.highlights);
      } else {
        throw new Error("Failed to parse highlights from AI.");
      }
    } catch (err) {
      alert("Error extracting highlights: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "4px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>🖍️ Smart Highlights</span>
        <div style={{ display: "flex", gap: "8px" }}>
          {highlights.length > 0 && (
            <button onClick={() => setHighlights([])} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ef4444", color: "#ef4444", background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
              Clear
            </button>
          )}
          <button onClick={generateHighlights} disabled={isGenerating} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>
            {isGenerating ? "⏳ Extracting..." : "✨ Auto-Highlight"}
          </button>
        </div>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
        {highlights.length === 0 && !isGenerating ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12.5px", border: "1.5px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}>
            No highlights saved. Click <b>Auto-Highlight</b> to instantly pull the most important facts from this page!
          </div>
        ) : (
          highlights.map((hlt, idx) => (
            <div key={idx} style={{ padding: "14px", background: "#fef3c7", borderLeft: "4px solid #f59e0b", borderRadius: "4px 8px 8px 4px", fontSize: "13px", color: "#451a03", lineHeight: "1.6", fontWeight: "500", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              {hlt}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
