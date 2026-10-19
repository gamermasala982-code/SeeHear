import React, { useEffect, useState } from "react";

export default function BlurredStagger({ text = "", className = "" }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={className} style={{ display: "inline-block", textAlign: "center" }}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          style={{
            display: "inline-block",
            whiteSpace: char === " " ? "pre" : "normal",
            filter: isLoaded ? "blur(0px)" : "blur(8px)",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(4px)",
            transition: `filter 500ms ease ${index * 25}ms, opacity 400ms ease ${index * 25}ms, transform 400ms ease ${index * 25}ms`,
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
