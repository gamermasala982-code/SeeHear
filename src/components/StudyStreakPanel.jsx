import React, { useMemo } from 'react';

export default function StudyStreakPanel({ tasks = [] }) {
  const resolvedTasks = useMemo(() => {
    if (Array.isArray(tasks) && tasks.length > 0) return tasks;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.toLowerCase().includes('task') || key.toLowerCase().includes('study'))) {
          const data = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(data) && data.length > 0) return data;
        }
      }
    } catch (e) {}
    return tasks || [];
  }, [tasks]);

  const totalTasks = resolvedTasks.length;
  const completedTasks = resolvedTasks.filter(t => t.completed || t.status === 'completed' || t.isCompleted).length;
  const is100Percent = totalTasks > 0 && completedTasks === totalTasks;

  const totalXP = is100Percent ? 200 : (completedTasks * 50);
  const currentStreak = is100Percent ? 1 : 0;

  // Grid with zero dummy dots
  const weeks = useMemo(() => {
    const days = [];
    const totalDays = 16 * 7;

    for (let i = totalDays - 1; i >= 0; i--) {
      const isToday = (i === 0);
      days.push({
        isToday,
        isCompleted: isToday && is100Percent
      });
    }

    const grouped = [];
    for (let i = 0; i < days.length; i += 7) {
      grouped.push(days.slice(i, i + 7));
    }
    return grouped;
  }, [is100Percent]);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: is100Percent ? '1.5px solid #86efac' : '1px solid #e2e8f0',
      borderRadius: '14px',
      padding: '16px 20px',
      marginBottom: '20px',
      boxShadow: is100Percent ? '0 4px 14px rgba(34, 197, 94, 0.1)' : '0 1px 3px rgba(0,0,0,0.03)',
      transition: 'all 0.25s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            background: is100Percent ? '#22c55e' : '#f1f5f9',
            color: is100Percent ? '#ffffff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {is100Percent ? '✓' : '0'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>Daily Study Streak</h3>
              <span style={{
                backgroundColor: is100Percent ? '#dcfce7' : '#f1f5f9',
                color: is100Percent ? '#15803d' : '#64748b',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {currentStreak} DAY STREAK
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              {is100Percent 
                ? '100% completed today. 1 green block earned for today.' 
                : `${completedTasks}/${totalTasks} tasks completed. Reach 100% to earn today's green block.`}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>Study EXP</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: is100Percent ? '#15803d' : '#4f46e5' }}>
            {totalXP} XP
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: '440px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '84px', marginRight: '6px', fontSize: '0.65rem', color: '#94a3b8' }}>
              <span>Mon</span><span>Wed</span><span>Fri</span>
            </div>

            {weeks.map((week, wIdx) => (
              <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    title={day.isToday ? (is100Percent ? 'Today: 100% Completed' : 'Today: Incomplete') : 'No activity'}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      backgroundColor: day.isCompleted ? '#22c55e' : '#ebedf0',
                      border: day.isToday && !day.isCompleted ? '1px dashed #94a3b8' : 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '10px', fontSize: '0.7rem', color: '#64748b' }}>
            <span>Incomplete</span>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ebedf0', border: '1px dashed #94a3b8' }} />
            <span style={{ marginLeft: '6px' }}>100% Done</span>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#22c55e' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
