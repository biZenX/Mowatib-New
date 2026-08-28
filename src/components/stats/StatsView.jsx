import React, { useState } from 'react';
import { i18n } from '../../services/i18n.js';
import { storageService } from '../../services/storage.js';

export function StatsView({ onOpenPaywall }) {
  const [period, setPeriod] = useState('7_days');
  const isPremium = storageService.settings.isPremium;
  const history = storageService.getPomodoroHistory();
  const isAr = i18n.isRTL();

  const formatDuration = (totalMins) => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours > 0) {
      return isAr ? `${hours}س ${mins}د` : `${hours}h ${mins}m`;
    }
    return isAr ? `${mins} دقيقة` : `${mins}m`;
  };

  const todayKey = new Date().toISOString().split('T')[0];
  const todaySessions = history.filter(s => s.started_at && s.started_at.startsWith(todayKey));
  const todayFocusMins = Math.round(todaySessions.filter(s => s.mode === 'focus').reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0) / 60);
  const todayBreakMins = Math.round(todaySessions.filter(s => s.mode !== 'focus').reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0) / 60);

  const daysCount = period === '7_days' ? 7 : 30;
  const now = new Date();
  const dayBars = [];

  const dayLettersEn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayLettersAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const daySessions = history.filter(s => s.started_at && s.started_at.startsWith(key) && s.mode === 'focus');
    const dayMins = Math.round(daySessions.reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0) / 60);
    dayBars.push({
      date: key,
      dayNumber: d.getDate(),
      dayLetter: isAr ? dayLettersAr[d.getDay()] : dayLettersEn[d.getDay()],
      mins: dayMins
    });
  }

  const totalPeriodMins = dayBars.reduce((acc, b) => acc + b.mins, 0);
  const avgPeriodMins = Math.round(totalPeriodMins / daysCount);
  const maxMins = Math.max(...dayBars.map(b => b.mins), 60);

  const taskMap = {};
  history.filter(s => s.mode === 'focus').forEach(s => {
    const title = s.task_title_snapshot || (isAr ? 'جلسة عامة' : 'General Focus');
    taskMap[title] = (taskMap[title] || 0) + Math.round((s.elapsed_seconds || 0) / 60);
  });

  const sortedTasks = Object.entries(taskMap).sort((a, b) => b[1] - a[1]);
  const totalTaskMins = sortedTasks.reduce((acc, t) => acc + t[1], 0);

  return (
    <div class="stats-responsive-container">
      <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--m3-text-main)', textAlign: 'center', letterSpacing: '-0.5px' }}>
        {i18n.t('stats_title')}
      </h2>

      <div class="stats-summary-grid">
        <div style={{ background: 'var(--m3-primary-container)', borderRadius: '24px', padding: '1.35rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: 'var(--m3-shadow-sm)' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--m3-on-primary-container)' }}>
            {isAr ? 'تركيز اليوم (Today Focus)' : 'Today Focus'}
          </span>
          <span style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--m3-on-primary-container)', letterSpacing: '-0.5px' }}>
            {formatDuration(todayFocusMins)}
          </span>
        </div>

        <div style={{ background: '#F3F6B5', borderRadius: '24px', padding: '1.35rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: 'var(--m3-shadow-sm)' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#4C5B26' }}>
            {isAr ? 'استراحة اليوم (Today Break)' : 'Today Break'}
          </span>
          <span style={{ fontSize: '1.85rem', fontWeight: '900', color: '#4C5B26', letterSpacing: '-0.5px' }}>
            {formatDuration(todayBreakMins)}
          </span>
        </div>

        <div style={{ background: 'var(--m3-surface-low)', border: '1px solid var(--m3-outline)', borderRadius: '24px', padding: '1.35rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', boxShadow: 'var(--m3-shadow-sm)' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--m3-text-secondary)' }}>
            {isAr ? 'المعدل اليومي (Daily Avg)' : 'Daily Average'}
          </span>
          <span style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--m3-primary)', letterSpacing: '-0.5px' }}>
            {formatDuration(avgPeriodMins)}
          </span>
        </div>
      </div>

      <div class="stats-main-grid">
        <div style={{ background: 'var(--m3-surface-low)', border: '1px solid var(--m3-outline)', borderRadius: '28px', padding: '1.5rem', boxShadow: 'var(--m3-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--m3-text-main)' }}>
              {period === '7_days' ? (isAr ? 'آخر ٧ أيام' : 'Last week') : (isAr ? 'آخر ٣٠ يوماً' : 'Last month')}
            </h3>

            <div class="view-mode-toggle">
              <button
                class={`toggle-btn ${period === '7_days' ? 'active' : ''}`}
                onClick={() => setPeriod('7_days')}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
              >
                ٧ أيام
              </button>
              <button
                class={`toggle-btn ${period === '30_days' ? 'active' : ''}`}
                onClick={() => setPeriod('30_days')}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
              >
                ٣٠ يوم
              </button>
            </div>
          </div>

          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--m3-text-main)', letterSpacing: '-0.5px', marginBottom: '1.5rem' }}>
            {formatDuration(avgPeriodMins)} <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--m3-text-secondary)' }}>{isAr ? 'معدل التركيز اليومي' : 'focus per day (avg)'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', gap: period === '7_days' ? '1rem' : '0.25rem', padding: '0 0.5rem', width: '100%' }}>
            {dayBars.map(b => {
              const heightPercent = maxMins > 0 ? Math.round((b.mins / maxMins) * 100) : 0;
              return (
                <div key={b.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: period === '7_days' ? '44px' : '14px',
                      height: `${Math.max(8, heightPercent)}%`,
                      background: b.mins > 0 ? 'var(--m3-primary)' : 'var(--m3-surface-container)',
                      borderRadius: '999px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    title={`${b.date}: ${formatDuration(b.mins)}`}
                  />
                  <span style={{ fontSize: period === '7_days' ? '0.8rem' : '0.65rem', fontWeight: '800', color: 'var(--m3-text-muted)', textAlign: 'center' }}>
                    {period === '7_days' ? b.dayLetter : b.dayNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'var(--m3-surface-low)', border: '1px solid var(--m3-outline)', borderRadius: '28px', padding: '1.5rem', boxShadow: 'var(--m3-shadow-sm)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--m3-text-main)' }}>
            {isAr ? 'توزيع الوقت حسب المهام' : 'Time by Task'}
          </h3>

          {sortedTasks.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--m3-text-muted)' }}>{isAr ? 'لا توجد جلسات مسجلة بعد.' : 'No sessions recorded yet.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {sortedTasks.slice(0, 5).map(([title, mins]) => {
                const pct = totalTaskMins > 0 ? Math.round((mins / totalTaskMins) * 100) : 0;
                return (
                  <div key={title}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.3rem' }}>
                      <span>{title}</span>
                      <span style={{ color: 'var(--m3-primary)' }}>{formatDuration(mins)} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--m3-surface-container)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--m3-primary)', borderRadius: '999px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
