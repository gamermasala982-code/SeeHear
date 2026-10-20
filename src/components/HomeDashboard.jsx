import React from "react";
import {
  BookOpen,
  Upload,
  Sparkles,
  MessageSquare,
  CalendarCheck,
  ArrowRight,
  FileText,
  CheckCircle2,
  Layers,
  TrendingUp,
  FolderOpen
} from "lucide-react";
import { BentoGrid, BentoCard } from "./ui/bento-01.jsx";

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
  const totalTasks = studyTasks.length;
  const taskProgressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const nextPendingTask = studyTasks.find((t) => !t.completed);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header className="page-header" style={{ alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "2.25rem", marginBottom: "0.375rem" }}>
            Your knowledge workspace
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>
            Read, understand, and learn from your documents with live AI intelligence.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate("documents")}
          >
            <FolderOpen size={16} />
            <span>Explore Library</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate("documents")}
          >
            <Upload size={16} aria-hidden="true" />
            <span>Upload Document</span>
          </button>
        </div>
      </header>

      <section aria-label="Workspace Metrics Overview" style={{ marginBottom: "2.5rem" }}>
        <BentoGrid>
          <BentoCard span={4} onClick={() => onNavigate("documents")}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--accent-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)" }}>
                  <Layers size={18} />
                </div>
                <span className="meta-tag">{documents.length} Available</span>
              </div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>My Documents</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Indexed academic papers, lecture notes, and user-uploaded PDFs.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)", marginTop: "1.25rem" }}>
              <span>Manage library</span>
              <ArrowRight size={14} />
            </div>
          </BentoCard>

          <BentoCard span={4} onClick={() => onNavigate("reader")}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--status-success-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--status-success-text)" }}>
                  <TrendingUp size={18} />
                </div>
                <span className="meta-tag">Active Session</span>
              </div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>Reading Progress</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {recentDocs.length > 0 ? "Recently active in " + (recentDocs[0]?.title || "").slice(0, 32) + "..." : "No active reading session recorded yet."}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)", marginTop: "1.25rem" }}>
              <span>Open Reader</span>
              <ArrowRight size={14} />
            </div>
          </BentoCard>

          <BentoCard span={4} onClick={() => onNavigate("planner")}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--status-warning-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--status-warning-text)" }}>
                  <CalendarCheck size={18} />
                </div>
                <span className="meta-tag">{completedTasks}/{totalTasks} Completed</span>
              </div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>Study Plan Tasks</h3>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {nextPendingTask ? "Next: \"" + (nextPendingTask.title || "").slice(0, 36) + "...\"" : "All scheduled study tasks completed!"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)", marginTop: "1.25rem" }}>
              <span>View planner</span>
              <ArrowRight size={14} />
            </div>
          </BentoCard>
        </BentoGrid>
      </section>

      <section aria-labelledby="quick-actions-heading" style={{ marginBottom: "2.5rem" }}>
        <h2 id="quick-actions-heading" className="section-heading">
          <span>Quick Actions</span>
        </h2>
        <div className="grid-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div className="surface-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("reader")}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, marginBottom: "0.375rem", color: "var(--text-primary)" }}>
                <BookOpen size={17} />
                <span>Read a Document</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Typography controls, side-by-side translations, and speech playback.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
              <span>Open Reader</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="surface-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("understand")}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, marginBottom: "0.375rem", color: "var(--text-primary)" }}>
                <Sparkles size={17} />
                <span>Understand Passage</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Real-time Groq AI Simple, Detailed, and Exam-focused breakdowns.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
              <span>Explore AI</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="surface-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("ask")}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, marginBottom: "0.375rem", color: "var(--text-primary)" }}>
                <MessageSquare size={17} />
                <span>Ask Across Sources</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Multi-document RAG synthesis with exact page citations.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
              <span>Ask Questions</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="surface-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("planner")}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, marginBottom: "0.375rem", color: "var(--text-primary)" }}>
                <CalendarCheck size={17} />
                <span>Plan Your Studies</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Manage tasks, milestones, and learning goals.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
              <span>Open Planner</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <section aria-labelledby="recent-docs-heading">
          <div className="section-heading">
            <span id="recent-docs-heading">Recently Opened Documents</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate("documents")}>
              View All ({documents.length})
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="surface-card" style={{ textAlign: "center", padding: "2.5rem" }}>
              <p style={{ color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                No recent documents in this session.
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate("documents")}>
                Upload or Select Document
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="surface-card"
                  style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", minWidth: 0, flex: 1 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--accent-primary)" }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "0.125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {doc.title}
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {doc.category} • {doc.pages} page(s) • {doc.estimatedMinutes} min read
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => onOpenDocument(doc.id, "reader")}
                  >
                    <span>Read</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="todays-plan-heading">
          <div className="section-heading">
            <span id="todays-plan-heading">Today's Study Plan ({completedTasks}/{totalTasks})</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate("planner")}>
              Manage Planner
            </button>
          </div>

          <div className="surface-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Completion Progress
              </span>
              <span className="meta-tag">{taskProgressPct}% Complete</span>
            </div>

            <div
              style={{
                height: "6px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "999px",
                overflow: "hidden",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  width: taskProgressPct + "%",
                  height: "100%",
                  backgroundColor: "var(--accent-primary)",
                  borderRadius: "999px",
                }}
              />
            </div>

            {studyTasks.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textAlign: "center", padding: "1rem" }}>
                No study tasks scheduled. Add tasks in the Study Planner.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1rem" }}>
                {studyTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.625rem",
                      padding: "0.625rem 0.75rem",
                      background: "var(--bg-canvas)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <CheckCircle2
                      size={16}
                      style={{ color: task.completed ? "var(--status-success-text)" : "var(--text-muted)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        textDecoration: task.completed ? "line-through" : "none",
                        color: task.completed ? "var(--text-muted)" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: "100%" }}
              onClick={() => onNavigate("planner")}
            >
              <CalendarCheck size={14} />
              <span>Open Study Planner & Tasks</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
