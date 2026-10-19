import React from "react";

export default function OrbitingCircles({
  className = "",
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 90,
  path = true,
}) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} className={className}>
      {path && (
        <svg
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: radius * 2, height: radius * 2 }}
          fill="none"
        >
          <circle
            cx={radius}
            cy={radius}
            r={radius - 1}
            stroke="var(--border-subtle)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
        </svg>
      )}

      {React.Children.map(children, (child, index) => {
        const angle = (index * (360 / React.Children.count(children))) % 360;
        return (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`,
              animation: `orbitAnim ${duration}s linear infinite`,
              animationDelay: `-${delay}s`,
              animationDirection: reverse ? "reverse" : "normal",
            }}
          >
            {child}
          </div>
        );
      })}

      <style>{ `
        @keyframes orbitAnim {
          from {
            transform: translate(-50%, -50%) rotate(0deg) translate(${radius}px) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg) translate(${radius}px) rotate(-360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="animation"] {
            animation: none !important;
          }
        }
      ` }</style>
    </div>
  );
}
