import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  Trash2,
  Check,
  Clock,
  ChevronRight,
  Calendar,
  Edit2,
  Save,
  X
} from "lucide-react";

export default function StudyPlanner({ documents, onOpenDocument }) {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("seehear_user_study_tasks");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || "");
  const [goalTag, setGoalTag] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("seehear_user_study_tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: "task-" + Date.now(),
      title: newTaskTitle.trim(),
      docId: selectedDocId || documents[0]?.id || "",
      goalTag: goalTag.trim() || "General",
      dueDate: dueDate.trim() || "Upcoming",
      completed: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setGoalTag("");
    setDueDate("");
  };

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = (id) => {
    if (!editTitle.trim()) return;
    setTasks(tasks.map((t) => (t.id === id ? { ...t, title: editTitle.trim() } : t)));
    setEditingId(null);
    setEditTitle("");
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextPendingTask = tasks.find((t) => !t.completed);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "INCOMPLETE") return !t.completed;
    if (filter === "COMPLETED") return t.completed;
    return true;
  });

  return (
    <div style={{ width: "100%", maxWidth: "1300px", margin: "0 auto", boxSizing: "border-box" }}>
      
      {/* 1. Header Area */}
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ 
          fontFamily: "var(--font-serif-reading)", 
          fontSize: "2.5rem", 
          fontWeight: 700, 
          color: "var(--text-primary)", 
          marginBottom: "0.5rem",
          letterSpacing: "-0.02em"
        }}>
          Study Planner
        </h1>
        <p style={{ fontSize: "1.0625rem", color: "var(--text-secondary)" }}>
          Plan your learning journey and stay on track with your goals.
        </p>
      </header>

      {/* 2. Main Two-Column Layout */}
      <div 
        className="planner-workspace-grid"
        style={{ 
          display: "grid", 
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", 
          gap: "2rem", 
          alignItems: "start" 
        }}
      >
        
        {/* A. LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Overall Progress Panel */}
          <section style={{ background: "#FFFFFF", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
            <div className="progress-panel-inner" style={{ display: "flex", alignItems: "stretch", gap: "2rem" }}>
              
              <div style={{ flex: "1 1 50%" }}>
                <h2 style={{ fontFamily: "var(--font-serif-reading)", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.25rem" }}>
                  Overall Progress
                </h2>
                <div style={{ height: "8px", backgroundColor: "#E2E8F0", borderRadius: "999px", overflow: "hidden", marginBottom: "0.875rem" }}>
                  <div style={{ width: `${progressPct}%`, height: "100%", backgroundColor: "#1E293B", borderRadius: "999px", transition: "width 0.3s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{completedCount} of {totalCount}</strong> tasks completed
                  </span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{progressPct}%</span>
                </div>
              </div>

              <div className="progress-divider" style={{ width: "1px", background: "var(--border-subtle)" }} />

              <div style={{ flex: "1 1 50%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                  <Clock size={16} />
                  <span>Next Task</span>
                </div>
                {nextPendingTask ? (
                  <>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {nextPendingTask.title}
                    </h3>
                    <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {nextPendingTask.goalTag} • {nextPendingTask.dueDate}
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", fontWeight: 500 }}>
                    All caught up! No pending tasks.
                  </p>
                )}
              </div>

            </div>
          </section>

          {/* Your Tasks Panel */}
          <section style={{ background: "#FFFFFF", border: "1px solid var(--border-subtle)", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <h2 style={{ fontFamily: "var(--font-serif-reading)", fontSize: "1.5rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Your Tasks
              </h2>
              <select
                className="select-field"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ width: "auto", minWidth: "160px", padding: "0.5rem 1rem", fontSize: "0.875rem", background: "#FFFFFF" }}
              >
                <option value="ALL">All Topics</option>
                <option value="INCOMPLETE">Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredTasks.length === 0 ? (
                <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9375rem" }}>
                  No tasks found in this view.
                </div>
              ) : (
                filteredTasks.map((task, index) => {
                  const isLast = index === filteredTasks.length - 1;
                  const isEditing = editingId === task.id;
                  const docLabel = documents.find(d => d.id === task.docId)?.title || "Document";

                  return (
                    <div
                      key={task.id}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "1.25rem 1.5rem", borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                        background: "transparent", gap: "1rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", minWidth: 0, flex: 1 }}>
                        <button
                          type="button"
                          onClick={() => toggleTaskCompletion(task.id)}
                          style={{
                            width: "22px", height: "22px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: "2px",
                            background: task.completed ? "#1E293B" : "transparent",
                            border: task.completed ? "1px solid #1E293B" : "2px solid #CBD5E1",
                            color: "#FFFFFF", transition: "all 0.15s ease"
                          }}
                        >
                          {task.completed && <Check size={14} strokeWidth={3} />}
                        </button>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                              <input
                                type="text"
                                className="input-field"
                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.9375rem", flex: 1 }}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(task.id)}><Save size={14}/></button>
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}><X size={14}/></button>
                            </div>
                          ) : (
                            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {task.title}
                            </h3>
                          )}
                          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {task.goalTag} • {docLabel}
                          </p>
                        </div>
                      </div>

                      {!isEditing && (
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                          <span
                            style={{
                              padding: "0.375rem 0.875rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 500,
                              background: task.completed ? "#DCFCE7" : "#F1F5F9",
                              color: task.completed ? "#166534" : "#475569"
                            }}
                          >
                            {task.completed ? "Completed" : "Pending"}
                          </span>
                          <div className="task-actions-group" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <button type="button" onClick={() => startEditing(task)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}><Edit2 size={14}/></button>
                            <button type="button" onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", padding: "4px" }}><Trash2 size={14}/></button>
                            <ChevronRight size={18} style={{ color: "var(--border-subtle)", marginLeft: "4px" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* B. RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Add New Task Panel */}
          <section style={{ background: "#F8FAFC", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
            <h2 style={{ fontFamily: "var(--font-serif-reading)", fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              Add New Task
            </h2>
            
            <form onSubmit={handleAddTask} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Task Description
                </label>
                <input
                  type="text"
                  placeholder="Enter task description..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "0.875rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Linked Document
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "0.875rem", background: "#FFFFFF", cursor: "pointer" }}
                >
                  {documents.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Topic / Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Algebra"
                  value={goalTag}
                  onChange={(e) => setGoalTag(e.target.value)}
                  style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "0.875rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Schedule (optional)
                </label>
                <textarea
                  placeholder="Add a schedule or short note..."
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: "100%", minHeight: "80px", padding: "0.625rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", fontSize: "0.875rem", resize: "none", fontFamily: "inherit" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.75rem", borderRadius: "6px", background: "#1E293B", color: "#FFFFFF",
                  fontSize: "0.9375rem", fontWeight: 500, border: "none", cursor: "pointer", marginTop: "0.5rem"
                }}
              >
                <Plus size={18} />
                <span>Add Task</span>
              </button>
            </form>
          </section>

          {/* Study Plan Summary Panel */}
          <section style={{ background: "#F8FAFC", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={18} /> Study Plan Summary
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Completed Tasks</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{completedCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Total Tasks</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{totalCount}</span>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Responsive Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .planner-workspace-grid { grid-template-columns: 1fr !important; }
          .progress-panel-inner { flex-direction: column !important; gap: 1.5rem !important; }
          .progress-divider { display: none !important; }
        }
        @media (max-width: 600px) {
          .task-actions-group button { display: none !important; }
        }
      `}} />
    </div>
  );
}
