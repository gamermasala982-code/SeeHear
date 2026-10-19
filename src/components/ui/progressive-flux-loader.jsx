import React, { useEffect, useState } from "react";

export default function ProgressiveFluxLoader({ value }) {
  const [progress, setProgress] = useState(value !== undefined ? value : 0);

  useEffect(() => {
    if (value !== undefined) {
      setProgress(value);
      return;
    }
    let start = Date.now();
    let duration = 3000;
    let timer;

    const update = () => {
      let elapsed = Date.now() - start;
      let pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        timer = requestAnimationFrame(update);
      }
    };
    timer = requestAnimationFrame(update);
    return () => cancelAnimationFrame(timer);
  }, [value]);

  return (
    <div style={{ width: "100%", maxWidth: "280px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>
        <span>Launching Workspace</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "6px",
          background: "var(--bg-subtle)",
          borderRadius: "999px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#000000",
            borderRadius: "999px",
            transition: "width 50ms linear",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.15)",
          }}
        />
      </div>
    </div>
  );
}
