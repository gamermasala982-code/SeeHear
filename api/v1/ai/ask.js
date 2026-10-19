export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { question, documents } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  const contextText = (documents || []).map(d => `Document: ${d.title}\nContent: ${(d.sections || []).map(s => s.originalText).join("\n")}`).join("\n\n");

  if (!apiKey) {
    return res.status(200).json({
      success: true,
      provider: "fallback_demo",
      answer: "Groq API Key not configured on server.",
      citations: []
    });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are SeeHear RAG Assistant. Answer the user question strictly using the provided document excerpts. Provide transparent citations." },
          { role: "user", content: `Selected Sources:\n\n${contextText}\n\nQuestion: ${question}` }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No answer generated.";
    const citations = (documents || []).map(d => ({
      docId: d.id,
      docTitle: d.title,
      reference: d.sections?.[0]?.pageRef || "Indexed Passage",
      excerpt: d.sections?.[0]?.originalText?.slice(0, 140) + "..."
    }));

    return res.status(200).json({ success: true, provider: "groq_llama3", answer, citations });
  } catch (err) {
    return res.status(502).json({ error: "Groq RAG synthesis failed", details: err.message });
  }
};