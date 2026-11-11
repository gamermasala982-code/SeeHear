import fs from 'fs';
import { execSync } from 'child_process';

let code = fs.readFileSync('src/components/ExplanationPanel.jsx', 'utf8');

// 1. Remove the unused state variable
code = code.replace(/const [questionInput, setQuestionInput] = useState\(""\);\n/g, "");

// 2. Remove the "Ask a Question" UI block completely using precise string replacement
const targetBlock = `{/* 3. Ask a Question */}
                <div>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <MessageSquare size={16} /> Ask a Question
                  </h3>
                  <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Ask anything about this document..." 
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      style={{ flex: 1, padding: "0.625rem", fontSize: "0.875rem", background: "#FFFFFF" }} 
                    />
                    <button type="submit" className="btn btn-primary" style={{ background: "#1E293B", padding: "0 0.75rem", border: "none" }}>
                      <Send size={16} />
                    </button>
                  </form>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span onClick={() => setQuestionInput("What did A.K. Gopalan decide?")} style={{ padding: "0.375rem 0.75rem", borderRadius: "999px", border: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer", background: "transparent" }}>What did A.K. Gopalan decide?</span>
                    <span onClick={() => setQuestionInput("How has Article 21 evolved?")} style={{ padding: "0.375rem 0.75rem", borderRadius: "999px", border: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer", background: "transparent" }}>How has Article 21 evolved?</span>
                    <span onClick={() => setQuestionInput("Explain due process in simple terms")} style={{ padding: "0.375rem 0.75rem", borderRadius: "999px", border: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer", background: "transparent" }}>Explain due process in simple terms</span>
                  </div>
                </div>`;

if (code.includes("{/* 3. Ask a Question */}")) {
  code = code.replace(targetBlock, "");
  fs.writeFileSync('src/components/ExplanationPanel.jsx', code, 'utf8');
  console.log("✅ Removed the non-functional 'Ask a Question' section from the Understand screen!");
} else {
  console.log("Section already removed.");
}

console.log("🔨 Verifying production build...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build passed successfully!");
} catch(err) {
  console.error("❌ Build failed:", err.message);
}
