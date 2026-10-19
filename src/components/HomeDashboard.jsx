import React from 'react';
import {
  BookOpen,
  Upload,
  Sparkles,
  MessageSquare,
  CalendarCheck,
  ArrowRight,
  FileText,
  Clock,
} from 'lucide-react';

export default function HomeDashboard({
  documents,
  recentDocIds,
  studyTasks,
  onOpenDocument,
  onNavigate,
}) {
  const recentDocs = recentDocIds
    .map((id) => documents.find((d) => d.id === id))
    .filter(Boolean);

  const completedTasks = studyTasks.filter((t) => t.completed).length;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Knowledge Workspace</h1>
          <p className="page-subtitle">
            Read academic and technical documents side-by-side with source-grounded explanations and multilingual support.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('documents')}
          >
            <Upload size={16} aria-hidden="true" />
            <span>Upload or Add Document</span>
          </button>
        </div>
      </header>

      <div className="notice-banner" role="status">
        <span>
          <strong>Interactive Frontend Demo:</strong> Built-in documents include verified English, Hindi, and illustrative Hinglish passages, browser-based text-to-speech, and source-cited Q&A. No external AI backend or cloud upload is required.
        </span>
      </div>

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-heading" style={{ marginBottom: '2rem' }}>
        <h2 id="quick-actions-heading" className="section-heading">
          <span>Workspace Workflows</span>
        </h2>
        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="surface-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                <BookOpen size={17} />
                <span>Document Reader</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Read full passages with typography controls, inline translations, and speech playback.
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('reader')}>
              <span>Open Reader</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="surface-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                <Sparkles size={17} />
                <span>Simplify & Understand</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Compare original dense passages with Simple, Detailed, or Exam-focused breakdowns.
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('understand')}>
              <span>Explore Explanations</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="surface-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                <MessageSquare size={17} />
                <span>Ask Across Sources</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Query across multiple selected texts with explicit section and page references.
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('ask')}>
              <span>Ask Questions</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="surface-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                <CalendarCheck size={17} />
                <span>Study Planner ({completedTasks}/{studyTasks.length})</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Track reading milestones and exam preparation tasks linked to your documents.
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('planner')}>
              <span>Manage Study Plan</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Recently Opened Documents */}
      <section aria-labelledby="recent-docs-heading" style={{ marginBottom: '2rem' }}>
        <div className="section-heading">
          <span id="recent-docs-heading">Recently Opened in Session</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('documents')}>
            View Full Library
          </button>
        </div>

        {recentDocs.length === 0 ? (
          <div className="surface-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              You haven’t opened any documents in this session yet. Select a sample reading below to begin.
            </p>
          </div>
        ) : (
          <div className="grid-3">
            {recentDocs.map((doc) => (
              <article key={doc.id} className="surface-card">
                <div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                    <span className="meta-tag">{doc.category}</span>
                    <span className="meta-tag">
                      <Clock size={12} /> {doc.estimatedMinutes} min
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem', lineHeight: 1.35 }}>
                    {doc.title}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {doc.summary}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenDocument(doc.id, 'reader')}
                  >
                    <BookOpen size={14} />
                    <span>Continue Reading</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenDocument(doc.id, 'understand')}
                  >
                    <span>Simplify</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* All Sample Documents */}
      <section aria-labelledby="sample-docs-heading">
        <div className="section-heading">
          <span id="sample-docs-heading">Available Readings & Multilingual Study Packs</span>
        </div>
        <div className="grid-3">
          {documents.map((doc) => (
            <article key={doc.id} className="surface-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="meta-tag">{doc.sourceType}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.pages} pages</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{doc.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
                  {doc.author}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {doc.summary}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onOpenDocument(doc.id, 'reader')}
                >
                  <FileText size={14} />
                  <span>Open in Reader</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
