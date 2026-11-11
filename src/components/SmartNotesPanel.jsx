import React, { useState, useEffect, useRef } from "react";
import SmartHighlightsPanel from "./SmartHighlightsPanel";

const GROQ_KEY = "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";

export default function SmartNotesPanel(props) {
  const { documentTitle = "Study Document", pageText = "", activeLanguage = "English" } = props;
  const containerRef = useRef(null);
  const [isHighlightsTab, setIsHighlightsTab] = useState(false);

  // Automatically detect whether the user clicked the "Highlights" tab or "Notes" tab
  useEffect(() => {
    const checkActiveTab = () => {
      if (!containerRef.current) return;
      const panelRoot = containerRef.current.closest("aside, section, div[ style ], div[class]")?.parentElement || document;
      const buttons = Array.from(panelRoot.querySelectorAll("button, [role='tab']"));
      const hlBtn = buttons.find(b => /highlights/i.test(b.innerText || ""));
      const notesBtn = buttons.find(b => /notes/i.test(b.innerText || ""));

      if (hlBtn && notesBtn) {
        const hlStyle = window.getComputedStyle(hlBtn);
        const notesStyle = window.getComputedStyle(notesBtn);
        const hlActive =
          hlBtn.getAttribute("aria-selected") === "true" ||
          hlBtn.className.includes("active") ||
          parseInt(hlStyle.fontWeight, 10) > parseInt(notesStyle.fontWeight, 10) ||
          hlStyle.borderBottomWidth !== notesStyle.borderBottomWidth && parseFloat(hlStyle.borderBottomWidth) > 0 ||
          hlStyle.backgroundColor !== notesStyle.backgroundColor && hlStyle.backgroundColor !== "rgba(0, 0, 0, 0)";
        setIsHighlightsTab(Boolean(hlActive));
      }
    };

    checkActiveTab();
    const handleClick = (e) => {
      const txt = e.target?.innerText || "";
      if (/highlights/i.test(txt)) setIsHighlightsTab(true);
      else if (/notes/i.test(txt)) setIsHighlightsTab(false);
      setTimeout(checkActiveTab, 30);
    };
    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);

  const storageKey = `seehear_notes_v2`;
  const [notes, setNotes] = useState(() => localStorage.getItem(`${storageKey}_notes`) || "");
  const [keyCues, setKeyCues] = useState(() => localStorage.getItem(`${storageKey}_cues`) || "");
  const [summary, setSummary] = useState(() => localStorage.getItem(`${storageKey}_summary`) || "");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => { localStorage.setItem(`${storageKey}_notes`, notes); }, [notes]);
  useEffect(() => { localStorage.setItem(`${storageKey}_cues`, keyCues); }, [keyCues]);
  useEffect(() => { localStorage.setItem(`${storageKey}_summary`, summary); }, [summary]);

  if (isHighlightsTab) {
    return (
      <div ref={containerRef}>
        <SmartHighlightsPanel {...props} />
            {activeTab === "narration" && <LiveNarrationPanel pageText={pageText} activeLanguage={activeLanguage} />}
      </div>
    );
  }

  const getActiveGroqModel = async () => {
    const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${GROQ_KEY}` }
    });
    const modelsData = await modelsRes.json();
    const list = (modelsData.data || []).map(m => m.id);
    return list.find(id =>
      id.includes("llama") && !id.includes("guard") && !id.includes("whisper") && !id.includes("tts")
    ) || list.find(id => id.includes("gpt-oss") || id.includes("qwen") || id.includes("gemma") || id.includes("mixtral")) || list[0];
  };

  const generateAINotes = async () => {
    setIsGenerating(true);
    try {
      let textToSummarize = pageText;
      if (!textToSummarize || textToSummarize.length < 40) {
        const allText = Array.from(document.querySelectorAll("p, h1, h2, h3, article, main"))
          .map(el => el.innerText?.trim())
          .filter(t => t && t.length > 25 && !t.includes("Cornell Study Notes"))
          .join("\n");
        textToSummarize = allText.slice(0, 3500);
      }

      if (!textToSummarize || textToSummarize.length < 30) {
        throw new Error("Could not detect page text to summarize.");
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
              content: `You are an expert academic note-maker. Write structured study notes in ${activeLanguage} (if Hinglish, use strictly Roman script mixed with English technical terms). Format your output using EXACTLY these three headings:\n[CUES]\n• term 1\n• term 2\n[NOTES]\n• detailed point 1\n• detailed point 2\n[SUMMARY]\n2-sentence revision takeaway.`
            },
            { role: "user", content: `Create study notes for this text:\n\n${textToSummarize}` }
          ],
          temperature: 0.3
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const raw = data.choices?.[0]?.message?.content || "";
      const cuesMatch = raw.split("[CUES]")[1]?.split("[NOTES]")[0]?.trim();
      const notesMatch = raw.split("[NOTES]")[1]?.split("[SUMMARY]")[0]?.trim();
      const summaryMatch = raw.split("[SUMMARY]")[1]?.trim();

      setKeyCues(cuesMatch || "• Core Concept\n• Key Definitions\n• Exam Application");
      setNotes(notesMatch || raw);
      setSummary(summaryMatch || "Review the key points above for quick exam preparation.");
    } catch (err) {
      alert("Error generating notes: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFormattedPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Please allow pop-ups to download the PDF.");

    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const formatHTML = (text) =>
      (text || "No entries added yet.")
        .split("\n")
        .filter(l => l.trim())
        .map(line => `<p style="margin: 6px 0;">${line}</p>`)
        .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Study Notes - ${documentTitle}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
          .brand { font-size: 24px; font-weight: bold; }
          .brand span { color: #2563eb; }
          .cornell-grid { display: grid; grid-template-columns: 32% 68%; border: 2px solid #cbd5e1; min-height: 560px; border-radius: 8px; overflow: hidden; }
          .cues { background: #f8fafc; padding: 18px; border-right: 2px solid #cbd5e1; }
          .notes { padding: 18px; }
          .summary { margin-top: 18px; padding: 18px; border: 2px solid #0f172a; border-radius: 8px; background: #f8fafc; }
          .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 10px; letter-spacing: 0.05em; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">See<span>Hear</span> Study Hub</div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            Cornell Study Template • ${activeLanguage}<br/>Date: ${dateStr}
          </div>
        </div>
        <div class="cornell-grid">
          <div class="cues">
            <div class="section-title">Key Cues & Questions</div>
            ${formatHTML(keyCues)}
          </div>
          <div class="notes">
            <div class="section-title">Detailed Study Notes</div>
            ${formatHTML(notes)}
          </div>
        </div>
        <div class="summary">
          <div class="section-title">Core Revision Summary</div>
          ${formatHTML(summary)}
        </div>
        <script>
          window.onload = () => { setTimeout(() => window.print(), 400); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "4px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a" }}>📝 Cornell Study Notes</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={generateAINotes} disabled={isGenerating} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>
            {isGenerating ? "⏳ Generating..." : "✨ AI Auto-Notes"}
          </button>
          <button onClick={downloadFormattedPDF} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#0f172a", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>
            ⬇ Download PDF
          </button>
        </div>
      </div>
      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px" }}>KEY CUES / QUESTIONS</label>
        <textarea value={keyCues} onChange={(e) => setKeyCues(e.target.value)} rows={3} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }} />
      </div>
      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px" }}>DETAILED STUDY NOTES</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={7} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }} />
      </div>
      <div>
        <label style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px" }}>QUICK REVISION SUMMARY</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12.5px" }} />
      </div>
    </div>
  );
}
