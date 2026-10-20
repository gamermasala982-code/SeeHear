import React from "react";

export function BentoGrid({ children, className = "" }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gap: "1.25rem",
        width: "100%",
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export function BentoCard({ children, className = "", style = {}, span = 4, onClick }) {
  const colSpan =
    span === 8
      ? "span 8 / span 8"
      : span === 6
      ? "span 6 / span 6"
      : span === 7
      ? "span 7 / span 7"
      : span === 5
      ? "span 5 / span 5"
      : span === 12
      ? "span 12 / span 12"
      : "span 4 / span 4";

  return (
    <div
      onClick={onClick}
      style={{
        gridColumn: colSpan,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(24, 24, 27, 0.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 150s ease, box-shadow 150ms ease, transform 150ms ease",
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}
