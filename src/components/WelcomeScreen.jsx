import React, { useState, useEffect } from "react";
import CursorDrivenParticleTypography from "./ui/cursor-driven-particles-typography.jsx";
import ProgressiveFluxLoader from "./ui/progressive-flux-loader.jsx";
import BlurredStagger from "./ui/blurred-stagger-text.jsx";

export default function WelcomeScreen() {
  const [progressVal, setProgressVal] = useState(0);

  useEffect(() => {
    let start = Date.now();
    let duration = 3000;
    let frameId;

    const step = () => {
      let elapsed = Date.now() - start;
      let p = Math.min(100, (elapsed / duration) * 100);
      setProgressVal(p);
      if (p < 100) {
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <main className="welcome-screen" aria-label="SeeHear Welcome Screen">
      <div className="welcome-glow-backdrop" />
      
      <div className="welcome-card-modern" style={{ textAlign: "center", paddingTop: "3.75rem", paddingBottom: "3.75rem" }}>
        {/* Cursor-Driven Particle Typography Wordmark (Slightly Larger) */}
        <div style={{ margin: "0 0 1.5rem" }}>
          <CursorDrivenParticleTypography
            text="SeeHear"
            fontSize={88}
            fontFamily="Instrument Serif, Georgia, serif"
            particleSize={1.2}
            particleDensity={3}
            dispersionStrength={9}
            returnSpeed={0.1}
            color="#18181B"
          />
        </div>

        {/* Tagline with BlurredStagger Letter-by-Letter Animation */}
        <div style={{ marginBottom: "2.25rem", fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
          <BlurredStagger text="Read Anything. Understand Everything. In Your Language." />
        </div>

        <div style={{ paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)" }}>
          <ProgressiveFluxLoader value={progressVal} />
        </div>
      </div>
    </main>
  );
}
