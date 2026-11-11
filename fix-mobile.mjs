import fs from 'fs';

// 1. Write clean bento-01.jsx
const bentoCode = `import React from "react";

export function BentoGrid({ children, className = "" }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1rem",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export function BentoCard({ children, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "1.25rem",
        boxShadow: "0 1px 3px rgba(24, 24, 27, 0.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}
`;

fs.writeFileSync("src/components/ui/bento-01.jsx", bentoCode, "utf8");

// 2. Ensure HomeDashboard uses BentoGrid cleanly
let home = fs.readFileSync("src/components/HomeDashboard.jsx", "utf8");
// Replace any span props inside HomeDashboard
home = home.replace(/span=\{[0-9]+\}/g, "");
fs.writeFileSync("src/components/HomeDashboard.jsx", home, "utf8");

console.log("✅ Mobile Bento Grid fixes applied successfully!");
