import fs from 'fs';
import { execSync } from 'child_process';

let code = fs.readFileSync('src/components/DocumentReader.jsx', 'utf8');

// Target block for "Ask a Question" in DocumentReader.jsx
const targetBlock = `                {/* 4. Ask a Question */}
                <div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <MessageSquare size={16} /> Ask a Question
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <input type="text" className="input-field" placeholder="Ask anything about this document..." style={{ flex: 1, padding: "0.625rem", fontSize: "0.875rem" }} />
                    <button type="button" className="btn btn-primary" style={{ background: "#1E293B", padding: "0 0.75rem", border: "none" }}>
                      <Send size={16} />
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", border: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer" }}>Explain this passage</span>
                    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", border: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer" }}>Key arguments</span>
                    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", border: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-secondary)", cursor: "pointer" }}>Related concepts</span>
                  </div>
                </div>`;

if (code.includes("Ask a Question")) {
  code = code.replace(targetBlock, "");
  fs.writeFileSync('src/components/DocumentReader.jsx', code, 'utf8');
  console.log("✅ Removed 'Ask a Question' from DocumentReader.jsx!");
} else {
  console.log("Section not found or already removed.");
}

console.log("🔨 Verifying production build...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build passed successfully!");
} catch(err) {
  console.error("❌ Build failed:", err.message);
}
