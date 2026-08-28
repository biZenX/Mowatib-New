import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { i18n } from '../../services/i18n.js';
import { storageService } from '../../services/storage.js';
import { audioService } from '../../services/audio.js';

export function HabitsView({ onOpenPaywall }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('local_fire_department');
  const [newColor, setNewColor] = useState('#4C662B');
  const [editingHabit, setEditingHabit] = useState(null);
  const [tick, setTick] = useState(0);

  const habits = storageService.getHabits();
  const isAr = i18n.isRTL();

  const handleToggleHabit = (habitId, dateStr, isToday) => {
    audioService.playClick();
    const isNowCompleted = storageService.toggleHabitCompletion(habitId, dateStr);
    setTick(t => t + 1);

    if (isNowCompleted) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  };

  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      storageService.createHabit({
        title: newTitle.trim(),
        icon: newIcon,
        color: newColor
      });
      setNewTitle('');
      setIsCreating(false);
      setTick(t => t + 1);
    } catch (err) {
      if (err.message && err.message.includes('limit')) {
        onOpenPaywall();
      }
    }
  };

  const handleDeleteHabit = (habitId) => {
    audioService.playClick();
    storageService.deleteHabit(habitId);
    setEditingHabit(null);
    setTick(t => t + 1);
  };

  const iconOptions = ['local_fire_department', 'menu_book', 'fitness_center', 'self_improvement', 'edit', 'code', 'local_drink', 'bedtime', 'psychology'];
  const colorOptions = ['#4C662B', '#E65100', '#7C4DFF', '#0288D1', '#C2185B', '#00796B'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{i18n.t('habits_title')}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--m3-text-secondary)', marginTop: '0.2rem' }}>
            {habits.length} / {storageService.settings.isPremium ? 299 : 5} {i18n.t('nav_habits')}
          </p>
        </div>

        <button class="m3-btn-primary" onClick={() => setIsCreating(true)}>
          <span class="material-symbols-rounded" style={{ fontSize: '20px', verticalAlign: 'middle' }}>add</span>
          <span>{i18n.t('new_habit')}</span>
        </button>
      </div>

      {habits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--m3-text-muted)' }}>
          <span class="material-symbols-rounded" style={{ fontSize: '48px', opacity: 0.5 }}>local_fire_department</span>
          <p style={{ marginTop: '0.5rem', fontWeight: '700' }}>{i18n.t('no_habits')}</p>
        </div>
      ) : (
        <div class="habits-grid">
          {habits.map(habit => {
            const stats = storageService.getHabitStats(habit.id);

            return (
              <div key={habit.id} class="habit-card">
                <div class="habit-card-top">
                  <div class="habit-title-group">
                    <div class="habit-icon-avatar" style={{ background: `${habit.color}20`, color: habit.color }}>
                      <span class="material-symbols-rounded">{habit.icon || 'star'}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--m3-text-main)' }}>
                        {habit.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: stats.isCompletedToday ? 'var(--m3-primary)' : 'var(--m3-text-muted)', marginTop: '0.1rem', fontWeight: '700' }}>
                        {stats.isCompletedToday ? '✅ تم إنجازها اليوم' : 'انقر على الدائرة لتسجيل إنجاز اليوم'}
                      </div>
                    </div>
                  </div>

                  <div class="habit-streak-pill">
                    <span>🔥</span>
                    <span>{stats.currentStreak} {i18n.t('days')}</span>
                  </div>
                </div>

                <div class="habit-days-row">
                  {stats.last7Days.map(day => (
                    <div key={day.date} class="habit-day-item">
                      <span class="habit-day-label">
                        {isAr ? day.dayNameAr : day.dayNameEn}
                      </span>
                      <button
                        type="button"
                        class={`habit-check-circle ${day.isCompleted ? 'completed' : ''} ${day.isToday ? 'is-today' : ''}`}
                        onClick={() => handleToggleHabit(habit.id, day.date, day.isToday)}
                        title={day.isToday ? 'إنجاز اليوم' : day.date}
                        style={{ cursor: 'pointer' }}
                      >
                        {day.isCompleted && <span class="material-symbols-rounded" style={{ fontSize: '22px' }}>check</span>}
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--m3-text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <span class="material-symbols-rounded" style={{ fontSize: '16px' }}>delete</span>
                    <span>{i18n.t('delete')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCreating && (
        <div class="m3-modal-backdrop" onClick={() => setIsCreating(false)}>
          <div class="m3-modal-card" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h2 class="modal-title">{i18n.t('new_habit')}</h2>
              <button class="m3-action-btn" onClick={() => setIsCreating(false)}>
                <span class="material-symbols-rounded">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateHabit} class="modal-body">
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>
                  {i18n.t('habit_title')} *
                </label>
                <input
                  type="text"
                  class="m3-input"
                  placeholder={i18n.t('habit_title')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', display: 'block' }}>
                  الأيقونة
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {iconOptions.map(icon => (
                    <button
                      type="button"
                      key={icon}
                      class={`m3-action-btn ${newIcon === icon ? 'active' : ''}`}
                      onClick={() => setNewIcon(icon)}
                      style={{ width: '40px', height: '40px', borderRadius: '10px' }}
                    >
                      <span class="material-symbols-rounded">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem', display: 'block' }}>
                  اللون
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {colorOptions.map(color => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setNewColor(color)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: color,
                        border: newColor === color ? '3px solid var(--m3-surface-highest)' : 'none',
                        boxShadow: newColor === color ? `0 0 0 2px ${color}` : 'none',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div class="modal-actions-row">
                <button type="button" class="m3-btn-secondary" onClick={() => setIsCreating(false)}>
                  {i18n.t('cancel')}
                </button>
                <button type="submit" class="m3-btn-primary">
                  {i18n.t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
