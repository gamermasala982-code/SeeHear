import React from 'react';
import { RotateCcw } from 'lucide-react';
import { LANGUAGES } from '../data/mockData.js';

export default function SettingsPanel({
  language,
  onChangeLanguage,
  settings,
  onUpdateSettings,
  onResetDefaults,
}) {
  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings & Accessibility</h1>
          <p className="page-subtitle">
            Configure reading typography, companion language defaults, and accessibility preferences. Changes apply immediately and persist in local storage.
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onResetDefaults}>
          <RotateCcw size={14} />
          <span>Reset to Defaults</span>
        </button>
      </header>

      <div className="grid-2">
        {/* Language & Reading Defaults */}
        <section className="surface-card" aria-labelledby="reading-prefs-heading">
          <h2 id="reading-prefs-heading" className="section-heading">
            <span>Reading & Language Preferences</span>
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="settings-lang-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Preferred Companion Language
            </label>
            <select
              id="settings-lang-select"
              className="select-field"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label} ({l.nativeLabel})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="settings-fontsize-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Reader Text Size
            </label>
            <select
              id="settings-fontsize-select"
              className="select-field"
              value={settings.readerFontSize}
              onChange={(e) => onUpdateSettings({ readerFontSize: e.target.value })}
            >
              <option value="0.95rem">Compact (15px)</option>
              <option value="1.0625rem">Standard Editorial (17px)</option>
              <option value="1.1875rem">Large Reading (19px)</option>
              <option value="1.3125rem">Extra Large (21px)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="settings-width-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Reading Measure (Line Width)
            </label>
            <select
              id="settings-width-select"
              className="select-field"
              value={settings.readerMaxWidth}
              onChange={(e) => onUpdateSettings({ readerMaxWidth: e.target.value })}
            >
              <option value="58ch">Focused Narrow (58ch)</option>
              <option value="68ch">Optimal Book Measure (68ch)</option>
              <option value="82ch">Wide Academic Measure (82ch)</option>
            </select>
          </div>

          <div>
            <label htmlFor="settings-lineheight-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Line Spacing
            </label>
            <select
              id="settings-lineheight-select"
              className="select-field"
              value={settings.readerLineHeight}
              onChange={(e) => onUpdateSettings({ readerLineHeight: e.target.value })}
            >
              <option value="1.6">Standard (1.6)</option>
              <option value="1.75">Relaxed Editorial (1.75)</option>
              <option value="2.0">Spacious / Dyslexia-Friendly (2.0)</option>
            </select>
          </div>
        </section>

        {/* Accessibility & Architecture Honesty */}
        <section className="surface-card" aria-labelledby="a11y-prefs-heading">
          <h2 id="a11y-prefs-heading" className="section-heading">
            <span>Accessibility & Visual Comfort</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
                style={{ marginTop: '4px', width: '16px', height: '16px' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>High-Contrast Surface Mode</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Replaces warm paper tones with pure white surfaces, crisp black text, and reinforced borders.
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                style={{ marginTop: '4px', width: '16px', height: '16px' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Minimize Interface Motion</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Disables entrance fades and smooth transitions across the workspace.
                </div>
              </div>
            </label>
          </div>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
              Product Honesty & Hacktoberfest Scope Note
            </strong>
            SeeHear is an interactive frontend prototype. Browser speech synthesis uses the native Web Speech API, and plain-text uploads use local FileReader inspection. Remote Cloudinary asset pipelines, OCR, and live LLM inference are not connected in this client-only build.
          </div>
        </section>
      </div>
    </div>
  );
}
