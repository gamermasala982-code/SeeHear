import React from "react";
import {
  BookOpen,
  Upload,
  Sparkles,
  MessageSquare,
  ArrowRight,
  FileText,
  CheckCircle2,
  Circle,
  CalendarCheck,
  FolderOpen
} from "lucide-react";

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

  return (
    <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", boxSizing: "border-box" }}>
      
      {/* 1. Header & Primary Actions */}
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ 
          fontFamily: "var(--font-serif-reading)", 
          fontSize: "2.5rem", 
          fontWeight: 700, 
          color: "var(--text-primary)", 
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em"
        }}>
          Knowledge Workspace
        </h1>
        <p style={{ 
          fontSize: "1.0625rem", 
          color: "var(--text-secondary)", 
          marginBottom: "1.75rem" 
        }}>
          Read, understand, and learn from your documents.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            style={{ 
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.625rem 1.25rem", borderRadius: "6px",
              background: "#1E293B", color: "#FFFFFF",
              fontSize: "0.875rem", fontWeight: 500, border: "none", cursor: "pointer"
            }}
            onClick={() => onNavigate("documents")}
          >
            <Upload size={16} />
            <span>Add document</span>
          </button>
          <button
            type="button"
            style={{ 
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.625rem 1.25rem", borderRadius: "6px",
              background: "transparent", color: "var(--text-primary)",
              fontSize: "0.875rem", fontWeight: 500, border: "1px solid var(--border-subtle)", cursor: "pointer"
            }}
            onClick={() => onNavigate("documents")}
          >
            <FolderOpen size={16} />
            <span>Browse library</span>
          </button>
        </div>
      </header>

      {/* 2. Workspace Cards Row */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: "1rem", 
        marginBottom: "3rem" 
      }}>
        
        <div 
          onClick={() => onNavigate("reader")}
          style={{ 
            padding: "1.5rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", 
            background: "var(--bg-surface)", cursor: "pointer", display: "flex", gap: "1rem", alignItems: "flex-start" 
          }}
        >
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", flexShrink: 0 }}>
            <BookOpen size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Continue reading</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.5rem" }}>
              Pick up where you left off from your recent documents.
            </p>
          </div>
          <ArrowRight size={16} style={{ color: "var(--text-muted)", marginTop: "2px", flexShrink: 0 }} />
        </div>

        <div 
          onClick={() => onNavigate("understand")}
          style={{ 
            padding: "1.5rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", 
            background: "var(--bg-surface)", cursor: "pointer", display: "flex", gap: "1rem", alignItems: "flex-start" 
          }}
        >
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", flexShrink: 0 }}>
            <Sparkles size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Understand a passage</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.5rem" }}>
              Get clear, simple explanations for complex text.
            </p>
          </div>
          <ArrowRight size={16} style={{ color: "var(--text-muted)", marginTop: "2px", flexShrink: 0 }} />
        </div>

        <div 
          onClick={() => onNavigate("ask")}
          style={{ 
            padding: "1.5rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", 
            background: "var(--bg-surface)", cursor: "pointer", display: "flex", gap: "1rem", alignItems: "flex-start" 
          }}
        >
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B5CF6", flexShrink: 0 }}>
            <MessageSquare size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Ask across sources</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.5rem" }}>
              Ask questions and get answers from your documents.
            </p>
          </div>
          <ArrowRight size={16} style={{ color: "var(--text-muted)", marginTop: "2px", flexShrink: 0 }} />
        </div>

      </div>

      {/* 3. Main Grid (Recent Docs + Study Plan) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "2rem", alignItems: "start" }} className="home-content-grid">
        
        {/* Recent Documents Column */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "var(--font-serif-reading)", fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Recent documents
            </h2>
            <button 
              type="button" 
              onClick={() => onNavigate("documents")} 
              style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", border: "1px dashed var(--border-subtle)", borderRadius: "8px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No recent documents in this session.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {recentDocs.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  style={{ 
                    padding: "1.25rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", 
                    background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0, flex: 1 }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: doc.title.toLowerCase().includes("python") || doc.title.toLowerCase().includes("graph") ? "#EFF6FF" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", color: doc.title.toLowerCase().includes("python") || doc.title.toLowerCase().includes("graph") ? "#3B82F6" : "#EF4444", flexShrink: 0 }}>
                      <FileText size={20} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {doc.title}
                      </h4>
                      <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        {doc.category || "Document"} • {doc.pages} pages
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button
                      type="button"
                      style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", borderRadius: "6px", background: "#1E293B", color: "#fff", fontSize: "0.8125rem", fontWeight: 500, border: "none", cursor: "pointer" }}
                      onClick={() => onOpenDocument(doc.id, "reader")}
                    >
                      <BookOpen size={14} /> Read
                    </button>
                    <button
                      type="button"
                      style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", borderRadius: "6px", background: "transparent", color: "var(--text-primary)", fontSize: "0.8125rem", fontWeight: 500, border: "1px solid var(--border-subtle)", cursor: "pointer" }}
                      onClick={() => onOpenDocument(doc.id, "understand")}
                    >
                      <Sparkles size={14} /> Understand
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Study Plan Column */}
        <section>
          <div style={{ padding: "1.5rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", background: "var(--bg-surface)" }}>
            <h2 style={{ fontFamily: "var(--font-serif-reading)", fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
              Today's Study Plan
            </h2>
            
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.375rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                {completedTasks} of {totalTasks} completed
              </span>
            </div>

            <div style={{ height: "6px", backgroundColor: "var(--bg-subtle)", borderRadius: "999px", overflow: "hidden", marginBottom: "1.5rem" }}>
              <div style={{ width: taskProgressPct + "%", height: "100%", backgroundColor: "#1E293B", borderRadius: "999px" }} />
            </div>

            {studyTasks.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", textAlign: "center", padding: "1rem 0" }}>
                No study tasks scheduled.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                {studyTasks.slice(0, 3).map((task) => (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <div style={{ color: task.completed ? "#1E293B" : "var(--border-subtle)", marginTop: "2px", flexShrink: 0 }}>
                      {task.completed ? <CheckCircle2 size={18} fill="#1E293B" color="#fff" /> : <Circle size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500, color: task.completed ? "var(--text-secondary)" : "var(--text-primary)", textDecoration: task.completed ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.125rem" }}>
                        {task.goalTag || "Study Task"}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--text-muted)", marginTop: "4px", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", padding: "0.75rem", borderRadius: "6px", background: "transparent", color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 600, border: "1px solid var(--border-subtle)", cursor: "pointer" }}
              onClick={() => onNavigate("planner")}
            >
              <CalendarCheck size={16} />
              <span>View study plan <ArrowRight size={14} style={{ display: "inline-block", verticalAlign: "middle" }}/></span>
            </button>
          </div>
        </section>

      </div>
      
      {/* 4. Ensure grid-2 stacks correctly on mobile */}
      <style dangerouslySetInnerHTML={{__html: "@media (max-width: 768px) { .home-content-grid { grid-template-columns: 1fr !important; } }"}} />
    </div>
  );
}
