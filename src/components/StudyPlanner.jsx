import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Check,
  X,
  BookOpen,
} from 'lucide-react';

export default function StudyPlanner({
  tasks,
  documents,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onOpenDocument,
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newDocId, setNewDocId] = useState(documents[0]?.id || '');
  const [newGoalTag, setNewGoalTag] = useState('Exam Revision');
  const [newDueDate, setNewDueDate] = useState('This Week');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | PENDING | COMPLETED
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'PENDING') return !t.completed;
    if (filterStatus === 'COMPLETED') return t.completed;
    return true;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      id: 'task-' + Date.now(),
      title: newTitle.trim(),
      docId: newDocId,
      goalTag: newGoalTag.trim() || 'Study Goal',
      dueDate: newDueDate.trim() || 'Upcoming',
      completed: false,
      isIllustrativeTemplate: false,
    });
    setNewTitle('');
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = (taskId) => {
    if (!editingTitle.trim()) return;
    onUpdateTask(taskId, { title: editingTitle.trim() });
    setEditingId(null);
  };

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Study Planner</h1>
          <p className="page-subtitle">
            Organize reading milestones and exam preparation tasks linked directly to your library documents.
          </p>
        </div>
        <div className="meta-tag" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}>
          Completion: {completedCount} of {tasks.length} tasks ({progressPercent}%)
        </div>
      </header>

      <div className="notice-banner">
        <span>
          <strong>Starter Study Plan Included:</strong> Initial tasks are labeled as illustrative demo templates. Any tasks you add, edit, complete, or remove are persisted locally in your browser’s <code>localStorage</code>.
        </span>
      </div>

      {/* Progress Bar */}
      <div className="surface-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <span>Overall Study Plan Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: '8px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--accent-primary)',
              transition: 'width 200ms ease',
            }}
          />
        </div>
      </div>

      {/* Add Task Form */}
      <section className="surface-card" style={{ marginBottom: '1.5rem' }} aria-labelledby="add-task-heading">
        <h2 id="add-task-heading" className="section-heading">
          <span>Add New Study Task</span>
        </h2>
        <form onSubmit={handleCreate}>
          <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
            <div>
              <label htmlFor="task-title-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Task Description
              </label>
              <input
                id="task-title-input"
                type="text"
                className="input-field"
                placeholder="e.g., Summarize Article 21 Golden Triangle in Hindi..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="task-doc-select" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Linked Document
              </label>
              <select
                id="task-doc-select"
                className="select-field"
                value={newDocId}
                onChange={(e) => setNewDocId(e.target.value)}
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label htmlFor="task-goal-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Learning Goal Tag
              </label>
              <input
                id="task-goal-input"
                type="text"
                className="input-field"
                value={newGoalTag}
                onChange={(e) => setNewGoalTag(e.target.value)}
              />
            </div>

            <div style={{ flex: '1 1 160px' }}>
              <label htmlFor="task-due-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Target Schedule
              </label>
              <input
                id="task-due-input"
                type="text"
                className="input-field"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      </section>

      {/* Filter & Task List */}
      <section aria-labelledby="tasks-list-heading">
        <div className="section-heading">
          <span id="tasks-list-heading">Scheduled Tasks ({filteredTasks.length})</span>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {['ALL', 'PENDING', 'COMPLETED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus(st)}
              >
                {st === 'ALL' ? 'All' : st === 'PENDING' ? 'Incomplete' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredTasks.map((task) => {
            const linkedDoc = documents.find((d) => d.id === task.docId);
            const isEditing = editingId === task.id;

            return (
              <div key={task.id} className="surface-card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                      style={{ marginTop: '2px', color: task.completed ? 'var(--status-success-text)' : 'var(--text-muted)' }}
                    >
                      {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>

                    <div style={{ flex: 1 }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            className="input-field"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            aria-label="Edit task title"
                          />
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(task.id)}>
                            <Check size={14} />
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.9375rem',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            marginBottom: '0.375rem',
                          }}
                        >
                          {task.title}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="meta-tag">{task.goalTag}</span>
                        <span className="meta-tag">Due: {task.dueDate}</span>
                        {task.isIllustrativeTemplate && (
                          <span className="meta-tag">Illustrative Demo Task</span>
                        )}
                        {linkedDoc && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '0.125rem 0.375rem', fontSize: '0.75rem' }}
                            onClick={() => onOpenDocument(linkedDoc.id, 'reader')}
                          >
                            <BookOpen size={12} />
                            <span>{linkedDoc.title}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => startEditing(task)}
                      aria-label="Edit task"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setConfirmDeleteId(task.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Accessible Confirmation Modal */}
      {confirmDeleteId && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="modal-card">
            <h3 id="delete-modal-title" style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Remove Study Task?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Are you sure you want to remove this task from your study planner?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onDeleteTask(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
