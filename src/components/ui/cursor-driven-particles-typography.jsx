import React, { useEffect, useRef } from "react";

export default function CursorDrivenParticleTypography({
  text = "SeeHear",
  fontSize = 86,
  fontFamily = "Instrument Serif, Georgia, serif",
  particleSize = 1.2,
  particleDensity = 3,
  dispersionStrength = 8,
  returnSpeed = 0.1,
  color = "#18181B",
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = 360);
    let height = (canvas.height = 110);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const offCanvas = document.createElement("canvas");
    const offCtx = offCanvas.getContext("2d");
    offCanvas.width = width;
    offCanvas.height = height;

    if (offCtx) {
      offCtx.font = `400 ${fontSize}px ${fontFamily}`;
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";
      offCtx.fillStyle = "#000000";
      offCtx.fillText(text, width / 2, height / 2);
    }

    const imgData = offCtx ? offCtx.getImageData(0, 0, width, height).data : [];
    const particles = [];

    for (let y = 0; y < height; y += particleDensity) {
      for (let x = 0; x < width; x += particleDensity) {
        const index = (y * width + x) * 4;
        if (imgData[index + 3] > 128) {
          particles.push({
            baseX: x,
            baseY: y,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
          });
        }
      }
    }

    let mouse = { x: -9999, y: -9999, active: false };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchmove", handleMouseMove, { passive: true });
    canvas.addEventListener("touchend", handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        if (!prefersReducedMotion && mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx + dx + dy * dy);
          const maxDist = 60;

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * dispersionStrength;
            p.vx -= (dx / dist) * force;
            p.vy -= (dy / dist) * force;
          }
        }

        const rx = p.baseX - p.x;
        const ry = p.baseY - p.y;
        p.vx += rx * returnSpeed;
        p.vy += ry * returnSpeed;

        p.vx *= 0.85;
        p.vy *= 0.85;

        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = color;
        ctx.fillRect(p.x, p.y, particleSize * 1.5, particleSize * 1.5);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        canvas.removeEventListener("touchmove", handleMouseMove);
        canvas.removeEventListener("touchend", handleMouseLeave);
      }
    };
  }, [text, fontSize, fontFamily, particleSize, particleDensity, dispersionStrength, returnSpeed, color]);

  return (
    <div className={className} style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", maxWidth: "360px", height: "110px", display: "block", touchAction: "none" }}
        aria-label={text}
      />
    </div>
  );
}
