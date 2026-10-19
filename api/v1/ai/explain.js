export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { text, style, language } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: "Passage text is required." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      provider: "fallback_demo",
      explanation: "Groq API Key not configured on server."
    });
  }

  const prompts = {
    simple: "Explain this academic passage in simple, everyday language.",
    detailed: "Provide a rigorous, detailed academic breakdown of this passage.",
    exam: "Provide high-yield exam-focused key points and recall bullets for this passage."
  };

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
          { role: "system", content: "You are SeeHear AI academic tutor. " + (prompts[style] || prompts.simple) },
          { role: "user", content: text }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    });

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "No explanation generated.";
    return res.status(200).json({ success: true, provider: "groq_llama3", explanation });
  } catch (err) {
    return res.status(502).json({ error: "Groq AI generation failed", details: err.message });
  }
};