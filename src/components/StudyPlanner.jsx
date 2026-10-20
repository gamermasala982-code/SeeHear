import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  BookOpen,
  AlertCircle,
  Edit2,
  Save,
  X
} from "lucide-react";

export default function StudyPlanner({ documents, onOpenDocument }) {
  // Initialize from localStorage or empty array (NO default demo tasks)
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("seehear_user_study_tasks");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || "");
  const [goalTag, setGoalTag] = useState("Exam Revision");
  const [dueDate, setDueDate] = useState("Today");
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
      goalTag: goalTag.trim() || "Study Goal",
      dueDate: dueDate.trim() || "Upcoming",
      completed: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
  };

  const toggleTaskCompletion = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
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
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, title: editTitle.trim() } : t))
    );
    setEditingId(null);
    setEditTitle("");
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filter === "INCOMPLETE") return !t.completed;
    if (filter === "COMPLETED") return t.completed;
    return true;
  });

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Study Planner & Task Manager</h1>
          <p className="page-subtitle">
            Organize reading milestones and exam preparation tasks linked directly to your library documents.
          </p>
        </div>
        <div className="meta-tag">
          Completion: {completedCount} of {totalCount} tasks ({progressPct}%)
        </div>
      </header>

      {/* Overall Progress Section */}
      <section className="surface-card" style={{ marginBottom: "1.75rem" }} aria-label="Study Plan Progress">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Overall Study Plan Progress</h2>
          <span style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{progressPct}%</span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "var(--bg-subtle)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              backgroundColor: "var(--accent-primary)",
              borderRadius: "999px",
              transition: "width 300ms ease",
            }}
          />
        </div>
      </section>

      {/* Add New Task Form */}
      <section className="surface-card" style={{ marginBottom: "2rem" }} aria-labelledby="add-task-heading">
        <h2 id="add-task-heading" className="section-heading" style={{ marginBottom: "1rem" }}>
          <span>Add New Study Task</span>
        </h2>

        <form onSubmit={handleAddTask} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          <div>
            <label htmlFor="task-desc" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem" }}>
              Task Description
            </label>
            <input
              id="task-desc"
              type="text"
              className="input-field"
              placeholder="e.g., Complete reading Chapter 4..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="task-doc" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem" }}>
              Linked Document
            </label>
            <select
              id="task-doc"
              className="select-field"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-goal" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem" }}>
              Learning Goal Tag
            </label>
            <input
              id="task-goal"
              type="text"
              className="input-field"
              placeholder="e.g., Exam Revision"
              value={goalTag}
              onChange={(e) => setGoalTag(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="task-due" style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem" }}>
              Target Schedule / Due Date
            </label>
            <input
              id="task-due"
              type="text"
              className="input-field"
              placeholder="e.g., Today, Tomorrow"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "40px" }}>
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </section>

      {/* Scheduled Tasks List */}
      <section aria-labelledby="tasks-list-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h2 id="tasks-list-heading" className="section-heading" style={{ margin: 0 }}>
            <span>Scheduled Tasks ({tasks.length})</span>
          </h2>

          <div style={{ display: "flex", gap: "0.375rem" }}>
            <button
              type="button"
              className={`btn btn-sm ${filter === "ALL" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter("ALL")}
            >
              All
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === "INCOMPLETE" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter("INCOMPLETE")}
            >
              Incomplete
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filter === "COMPLETED" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter("COMPLETED")}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="surface-card" style={{ textAlign: "center", padding: "3rem" }}>
            <CalendarCheck size={36} style={{ color: "var(--text-muted)", marginBottom: "0.75rem" }} />
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem" }}>No tasks found</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {tasks.length === 0 ? "You have not added any study tasks yet. Use the form above to create your first task." : "No tasks match the selected filter."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredTasks.map((task) => {
              const linkedDoc = documents.find((d) => d.id === task.docId);
              const isEditing = editingId === task.id;

              return (
                <div
                  key={task.id}
                  className="surface-card"
                  style={{
                    padding: "1rem 1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    backgroundColor: task.completed ? "var(--bg-canvas)" : "var(--bg-surface)",
                    opacity: task.completed ? 0.85 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: 0, color: task.completed ? "var(--status-success-text)" : "var(--text-muted)" }}
                      onClick={() => toggleTaskCompletion(task.id)}
                      aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
                    >
                      {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </button>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <input
                            type="text"
                            className="input-field"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.9375rem" }}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => saveEdit(task.id)}
                          >
                            <Save size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3
                            style={{
                              fontSize: "0.9375rem",
                              fontWeight: 600,
                              marginBottom: "0.25rem",
                              textDecoration: task.completed ? "line-through" : "none",
                              color: task.completed ? "var(--text-muted)" : "var(--text-primary)",
                            }}
                          >
                            {task.title}
                          </h3>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span className="meta-tag">{task.goalTag}</span>
                            <span className="meta-tag" style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                              Due: {task.dueDate}
                            </span>
                            {linkedDoc && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: "0 0.25rem", height: "auto", fontSize: "0.75rem", color: "var(--accent-primary)" }}
                                onClick={() => onOpenDocument(linkedDoc.id, "reader")}
                              >
                                <BookOpen size={12} style={{ marginRight: "3px" }} />
                                <span>{linkedDoc.title}</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => startEditing(task)}
                        aria-label="Edit task"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: "var(--status-error-text, #EF4444)" }}
                        onClick={() => deleteTask(task.id)}
                        aria-label="Delete task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
