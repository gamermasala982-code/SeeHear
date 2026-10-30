const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function analyzeDiagramWithGemma4({ documentTitle, documentContent = '', customQuery = '', diagramType = 'concept' }) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    return {
      success: false,
      source: 'System Error',
      text: 'VITE_GEMINI_API_KEY is missing in your .env file. Please add it to generate dynamic diagrams.'
    };
  }

  const prompt = `You are a visual academic assistant powered by Gemma 4. 
Your task is to generate a strictly text-based ASCII visual diagram answering the user's query, based strictly on the provided document context.

Document Title: ${documentTitle}
Document Context: ${documentContent ? documentContent.substring(0, 15000) : 'Rely on your general knowledge if context is short.'}
User Query: ${customQuery}
Requested Format: ${diagramType === 'flowchart' ? 'Decision Flowchart (use arrows ──▶, yes/no branches, and logic nodes)' : 'Concept Map (use hierarchical trees, brackets, and relationship arrows)'}

Structure your response EXACTLY like this:
### ${diagramType === 'flowchart' ? 'Flowchart' : 'Concept Map'}: ${customQuery || documentTitle}
\`\`\`text
[Insert your detailed ASCII diagram here. Make it clean, well-spaced, and easy to read on mobile]
\`\`\`
### Core Summary
[Provide a 2-3 sentence explanation of the diagram's logic based on the document.]`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return { success: true, source: 'Gemma 4 Multimodal Engine (Live)', text };
    } else {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'API request failed');
    }
  } catch (err) {
    return {
      success: false,
      source: 'Gemma 4 Error',
      text: `Failed to generate diagram: ${err.message}`
    };
  }
}
