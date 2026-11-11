import React from "react";
import { BookOpen, Accessibility, RotateCcw, Lightbulb } from "lucide-react";
import { LANGUAGES } from "../data/mockData.js";

export default function SettingsPanel({
  language,
  onChangeLanguage,
  settings,
  onUpdateSettings,
  onResetSettings
}) {
  const handleChange = (key, value) => {
    onUpdateSettings({ [key]: value });
  };

  return (
    <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", boxSizing: "border-box" }}>
      
      {/* 1. Header Area */}
      <header style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ 
            fontFamily: "var(--font-serif-reading)", 
            fontSize: "2.5rem", 
            fontWeight: 700, 
            color: "var(--text-primary)", 
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em"
          }}>
            Settings & Accessibility
          </h1>
          <p style={{ fontSize: "1.0625rem", color: "var(--text-secondary)", maxWidth: "800px", lineHeight: 1.5 }}>
            Customize your reading experience, language preferences, and accessibility options for a more comfortable and productive learning journey.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetSettings}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.625rem 1.25rem", borderRadius: "999px",
            background: "transparent", color: "var(--text-primary)",
            fontSize: "0.875rem", fontWeight: 600, border: "1px solid var(--border-subtle)",
            cursor: "pointer", flexShrink: 0
          }}
        >
          <RotateCcw size={16} />
          <span>Reset to Defaults</span>
        </button>
      </header>

      {/* 2. Main Two-Column Grid */}
      <div 
        className="settings-workspace-grid"
        style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", 
          gap: "2rem", 
          alignItems: "start" 
        }}
      >
        
        {/* Left Column: Reading & Language Preferences */}
        <section style={{ background: "#FFFFFF", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-serif-reading)", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <BookOpen size={20} style={{ color: "var(--accent-primary)" }} /> Reading & Language Preferences
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Preferred Language
              </label>
              <select
                className="select-field"
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value)}
                style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.9375rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", cursor: "pointer" }}
              >
                {LANGUAGES.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.label.replace(" (Illustrative Demo)", "")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Reader Text Size
              </label>
              <select
                className="select-field"
                value={settings.readerFontSize}
                onChange={(e) => handleChange("readerFontSize", e.target.value)}
                style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.9375rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", cursor: "pointer" }}
              >
                <option value="0.95rem">Small (15px)</option>
                <option value="1.0625rem">Medium (17px)</option>
                <option value="1.1875rem">Large (19px)</option>
                <option value="1.3125rem">Extra Large (21px)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Reading Measure (Line Width)
              </label>
              <select
                className="select-field"
                value={settings.readerLineLength}
                onChange={(e) => handleChange("readerLineLength", e.target.value)}
                style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.9375rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", cursor: "pointer" }}
              >
                <option value="60ch">Narrow (60ch)</option>
                <option value="70ch">Optimal (70ch)</option>
                <option value="85ch">Wide (85ch)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                Line Spacing
              </label>
              <select
                className="select-field"
                value={settings.readerLineHeight}
                onChange={(e) => handleChange("readerLineHeight", e.target.value)}
                style={{ width: "100%", padding: "0.75rem 1rem", fontSize: "0.9375rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px", cursor: "pointer" }}
              >
                <option value="1.5">Compact (1.5)</option>
                <option value="1.75">Normal (1.75)</option>
                <option value="2.0">Spacious (2.0)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Right Column: Accessibility & Visual Comfort */}
        <section style={{ background: "#F8FAFC", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "2rem" }}>
          <h2 style={{ fontFamily: "var(--font-serif-reading)", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <Accessibility size={20} style={{ color: "var(--accent-primary)" }} /> Accessibility & Visual Comfort
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            <label style={{ display: "flex", alignItems: "flex-start", gap: "1rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.highContrastMode}
                onChange={(e) => handleChange("highContrastMode", e.target.checked)}
                style={{ width: "18px", height: "18px", marginTop: "3px", cursor: "pointer", accentColor: "#1E293B" }}
              />
              <div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  High-Contrast Surface Mode
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Increases contrast for better readability and reduces eye strain.
                </div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "1rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => handleChange("reducedMotion", e.target.checked)}
                style={{ width: "18px", height: "18px", marginTop: "3px", cursor: "pointer", accentColor: "#1E293B" }}
              />
              <div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  Minimize Interface Motion
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Reduces animations and transitions for a calmer reading experience.
                </div>
              </div>
            </label>

            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "2rem", marginTop: "1rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Lightbulb size={16} /> Reading Experience
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                These settings help you personalize your reading environment and make content easier to read, especially during long study sessions.
              </p>
            </div>

          </div>
        </section>

      </div>

      {/* Responsive Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .settings-workspace-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}
