import React, { useRef, useState } from "react";

export default function TiltCard({ children, className = "", maxTilt = 8, scale = 1.02 }) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [spotlightStyle, setSpotlightStyle] = useState({ opacity: 0, x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`);
    setSpotlightStyle({ opacity: 0.12, x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");
    setSpotlightStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: isHovered ? "transform 80ms cubic-bezier(0.03, 0.98, 0.52, 0.99)" : "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
        position: "relative",
        willChange: "transform",
      }}
      className={className}
    >
      {/* Cursor-following spotlight effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          background: `radial-gradient(300px circle at ${spotlightStyle.x}px ${spotlightStyle.y}px, rgba(38,62,82,0.14), transparent 80%)`,
          opacity: spotlightStyle.opacity,
          transition: "opacity 200ms ease",
          zIndex: 2,
        }}
      />
      {children}
    </div>
  );
}
