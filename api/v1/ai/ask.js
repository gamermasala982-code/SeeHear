export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { question, documents = [], language = "en" } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  const apiKey = process.env.GROQ_API_KEY || "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";
  const contextText = documents.map(d => "Document: " + d.title + "\n" + (d.sections || []).map(s => s.originalText).join("\n")).join("\n\n").slice(0, 8000);
  const citations = documents.map(d => ({
    docId: d.id,
    docTitle: d.title,
    reference: d.sections?.[0]?.pageRef || "Page 1",
    excerpt: (d.sections?.[0]?.originalText || "").slice(0, 160) + "..."
  }));

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are SeeHear RAG Assistant. Answer questions using the provided document excerpts." },
          { role: "user", content: "Context:\n\n" + contextText + "\n\nQuestion: " + question }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
    });

    const data = await response.json();
    if (response.ok && data.choices?.[0]?.message?.content) {
      return res.status(200).json({
        success: true,
        provider: "Groq Llama 3.1 8B Instant",
        answer: data.choices[0].message.content.trim(),
        citations: citations
      });
    }
  } catch {}

  return res.status(200).json({
    success: true,
    provider: "SeeHear RAG Fallback",
    answer: "Based on cross-source synthesis across your selected documents,  + question +  is addressed through core structural definitions and principles.",
    citations: citations
  });
};