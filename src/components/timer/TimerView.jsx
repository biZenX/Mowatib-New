import React, { useState, useEffect } from 'react';
import { i18n } from '../../services/i18n.js';
import { storageService } from '../../services/storage.js';
import { audioService } from '../../services/audio.js';
import { notificationService } from '../../services/notifications.js';
import { POMODORO_MODE, POMODORO_STATUS } from '../../domain/pomodoroReconstruction.js';

const RADIUS = 132;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const FOCUS_CYCLE_STAGES = [
  { step: 1, type: POMODORO_MODE.FOCUS, titleKey: 'focus', defaultMins: 25 },
  { step: 2, type: POMODORO_MODE.SHORT_BREAK, titleKey: 'short_break', defaultMins: 5 },
  { step: 3, type: POMODORO_MODE.FOCUS, titleKey: 'focus', defaultMins: 25 },
  { step: 4, type: POMODORO_MODE.LONG_BREAK, titleKey: 'long_break', defaultMins: 15 }
];

export function TimerView() {
  const [timerState, setTimerState] = useState(() => storageService.getActivePomodoroState());
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [mode, setMode] = useState(POMODORO_MODE.FOCUS);
  const [isZenMode, setIsZenMode] = useState(false);

  const activeTasks = storageService.getActiveTasks();
  const settings = storageService.settings;
  const history = storageService.getPomodoroHistory();
  const isAr = i18n.isRTL();

  const getModeDuration = (targetMode) => {
    if (targetMode === POMODORO_MODE.SHORT_BREAK) return (settings.shortBreakTime || 5) * 60;
    if (targetMode === POMODORO_MODE.LONG_BREAK) return (settings.longBreakTime || 15) * 60;
    if (targetMode === POMODORO_MODE.INFINITE) return 0;
    return (settings.focusTime || 25) * 60;
  };

  const nextStepNum = currentStep >= 4 ? 1 : currentStep + 1;
  const nextStage = FOCUS_CYCLE_STAGES.find(s => s.step === nextStepNum) || FOCUS_CYCLE_STAGES[0];
  const nextStageDuration = getModeDuration(nextStage.type);
  const nextStageMins = String(Math.floor(nextStageDuration / 60)).padStart(2, '0');
  const nextStageSecs = String(nextStageDuration % 60).padStart(2, '0');

  const todayKey = new Date().toISOString().split('T')[0];
  const todaySessions = history.filter(s => s.started_at && s.started_at.startsWith(todayKey));
  const todayFocusMins = Math.round(todaySessions.filter(s => s.mode === 'focus').reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0) / 60);
  const dailyGoalMins = settings.dailyGoalMinutes || 100;
  const goalProgressPercent = Math.min(100, Math.round((todayFocusMins / dailyGoalMins) * 100));

  const linkedTask = selectedTaskId ? activeTasks.find(t => t.id === selectedTaskId) : null;

  const advanceToNextStep = () => {
    setCurrentStep(nextStepNum);
    setMode(nextStage.type);
    storageService.resetPomodoro();
  };

  const handleSelectStepDirectly = (stepNum) => {
    audioService.playClick();
    const stage = FOCUS_CYCLE_STAGES.find(s => s.step === stepNum) || FOCUS_CYCLE_STAGES[0];
    setCurrentStep(stepNum);
    setMode(stage.type);
    if (!isRunning) {
      storageService.resetPomodoro();
    }
  };

  const handleSwitchModeTab = (newMode) => {
    audioService.playClick();
    setMode(newMode);
    if (newMode === POMODORO_MODE.FOCUS) {
      if (currentStep !== 1 && currentStep !== 3) setCurrentStep(1);
    } else if (newMode === POMODORO_MODE.SHORT_BREAK) {
      setCurrentStep(2);
    } else if (newMode === POMODORO_MODE.LONG_BREAK) {
      setCurrentStep(4);
    }
    if (!isRunning) {
      storageService.resetPomodoro();
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const state = storageService.getActivePomodoroState();
      setTimerState(state);

      if (state.status === POMODORO_STATUS.RUNNING) {
        notificationService.updateTitle(
          formatTime(state.remainingSeconds, state.mode === POMODORO_MODE.INFINITE ? state.elapsedSeconds : null),
          i18n.t(state.mode),
          true
        );
      } else {
        notificationService.updateTitle('', '', false);
      }

      if (state.isFinished) {
        audioService.playAlarm(settings.alarmSound || 'zen-bowl');
        notificationService.notify('انتهت الجلسة!', {
          body: i18n.t(state.mode === POMODORO_MODE.FOCUS ? 'session_finished_focus' : 'session_finished_break')
        });
        storageService.completePomodoro();
        advanceToNextStep();
      }
    }, 500);

    return () => {
      clearInterval(interval);
      notificationService.updateTitle('', '', false);
    };
  }, [settings.alarmSound, currentStep, mode]);

  const handleStart = () => {
    audioService.playClick();
    const duration = getModeDuration(mode);
    storageService.startPomodoro(mode, duration, selectedTaskId || null);
    setTimerState(storageService.getActivePomodoroState());
  };

  const handlePause = () => {
    audioService.playClick();
    storageService.pausePomodoro();
    setTimerState(storageService.getActivePomodoroState());
  };

  const handleResume = () => {
    audioService.playClick();
    storageService.resumePomodoro();
    setTimerState(storageService.getActivePomodoroState());
  };

  const handleReset = () => {
    audioService.playClick();
    storageService.resetPomodoro();
    setTimerState(storageService.getActivePomodoroState());
  };

  const handleSkip = () => {
    audioService.playClick();
    advanceToNextStep();
    setTimerState(storageService.getActivePomodoroState());
  };

  const handleToggleSubtask = (taskId, subtaskId) => {
    storageService.toggleSubtask(taskId, subtaskId);
  };

  const formatTime = (seconds, countUpSeconds = null) => {
    const s = countUpSeconds !== null ? countUpSeconds : seconds;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isRunning = timerState.status === POMODORO_STATUS.RUNNING;
  const isPaused = timerState.status === POMODORO_STATUS.PAUSED && timerState.elapsedSeconds > 0;
  const isBreak = mode !== POMODORO_MODE.FOCUS;

  let displayRemaining = timerState.remainingSeconds;
  let displayElapsed = timerState.elapsedSeconds;

  if (!isRunning && !isPaused) {
    displayRemaining = getModeDuration(mode);
    displayElapsed = 0;
  } else if (timerState.mode && timerState.mode !== mode) {
    displayRemaining = getModeDuration(mode);
    displayElapsed = 0;
  }

  if (mode === POMODORO_MODE.INFINITE) {
    displayRemaining = 0;
    displayElapsed = (isRunning || isPaused) ? (timerState.elapsedSeconds || 0) : 0;
  } else {
    if (displayRemaining > 86400 || displayRemaining < 0 || isNaN(displayRemaining)) {
      displayRemaining = getModeDuration(mode);
    }
  }

  const totalSecs = (isRunning || isPaused)
    ? (mode === POMODORO_MODE.INFINITE ? Math.max(60, displayElapsed) : (timerState.remainingSeconds + timerState.elapsedSeconds || getModeDuration(mode)))
    : getModeDuration(mode);

  const progressFraction = totalSecs > 0 ? (displayElapsed / totalSecs) : 0;
  const strokeOffset = CIRCUMFERENCE * (1 - progressFraction);

  const generateWavyPath = (fraction) => {
    const points = [];
    const steps = 70;
    const endAngle = fraction * 2 * Math.PI;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * endAngle - Math.PI / 2;
      const wave = Math.sin(i * 1.6) * 5;
      const r = RADIUS + wave;
      const x = 160 + r * Math.cos(angle);
      const y = 160 + r * Math.sin(angle);
      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(' ');
  };

  let screenHeaderTitle = i18n.t(mode);
  if (!isRunning && !isPaused && mode === POMODORO_MODE.FOCUS) {
    screenHeaderTitle = i18n.t('app_name');
  }

  return (
    <div class="timer-responsive-layout">
      <div class="timer-main-card">
        <h2 style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--m3-primary)', textAlign: 'center', letterSpacing: '-0.5px', marginBottom: '0.75rem' }}>
          {screenHeaderTitle}
        </h2>

        <div class="view-mode-toggle" style={{ marginBottom: '1.25rem', width: '100%', justifyContent: 'center' }}>
          {[
            { id: POMODORO_MODE.FOCUS, label: i18n.t('focus'), icon: 'bolt' },
            { id: POMODORO_MODE.SHORT_BREAK, label: i18n.t('short_break'), icon: 'coffee' },
            { id: POMODORO_MODE.LONG_BREAK, label: i18n.t('long_break'), icon: 'park' },
            { id: POMODORO_MODE.INFINITE, label: i18n.t('infinite_focus'), icon: 'all_inclusive' }
          ].map(m => (
            <button
              key={m.id}
              type="button"
              class={`toggle-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => handleSwitchModeTab(m.id)}
            >
              <span class="material-symbols-rounded" style={{ fontSize: '16px' }}>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <div class="dial-box" style={{ width: '320px', height: '320px' }} onClick={() => setIsZenMode(!isZenMode)} title="Zen Mode">
          <svg class="dial-svg" viewBox="0 0 320 320">
            <circle
              class="track-circle"
              cx="160"
              cy="160"
              r={RADIUS}
              style={{
                stroke: isBreak ? '#F3F6B5' : 'var(--m3-track-focus)',
                strokeWidth: '12px'
              }}
            />
            {!isBreak ? (
              <circle
                class="progress-arc"
                cx="160"
                cy="160"
                r={RADIUS}
                style={{
                  stroke: 'var(--m3-primary)',
                  strokeWidth: '12px',
                  strokeDasharray: CIRCUMFERENCE,
                  strokeDashoffset: strokeOffset
                }}
              />
            ) : (
              <path
                class="progress-wavy-path"
                d={generateWavyPath(progressFraction)}
                style={{
                  stroke: '#4C5B26',
                  strokeWidth: '8px'
                }}
              />
            )}
          </svg>

          <div class="clock-center-group">
            <div class="clock-digits" style={{ fontSize: '5rem' }}>
              {formatTime(displayRemaining, mode === POMODORO_MODE.INFINITE ? displayElapsed : null)}
            </div>
            <div class="session-badge-text" style={{ fontSize: '1.1rem', fontWeight: '800', opacity: 0.75 }}>
              {mode !== POMODORO_MODE.INFINITE ? `${currentStep} ${isAr ? 'من 4' : 'of 4'}` : i18n.t('infinite_focus')}
            </div>
          </div>
        </div>

        <div class="timer-controls-row">
          {!isRunning && !isPaused && (
            <button class="m3-play-stadium-btn" onClick={handleStart} title={i18n.t('play')}>
              <span class="material-symbols-rounded" style={{ fontSize: '38px' }}>play_arrow</span>
            </button>
          )}

          {isRunning && (
            <button class="m3-play-stadium-btn is-running" onClick={handlePause} title={i18n.t('pause')}>
              <span class="material-symbols-rounded" style={{ fontSize: '36px' }}>pause</span>
            </button>
          )}

          {isPaused && (
            <button class="m3-play-stadium-btn" onClick={handleResume} title={i18n.t('play')}>
              <span class="material-symbols-rounded" style={{ fontSize: '38px' }}>play_arrow</span>
            </button>
          )}

          <button class="m3-reset-circle-btn" title={i18n.t('reset')} onClick={handleReset}>
            <span class="material-symbols-rounded" style={{ fontSize: '28px' }}>restart_alt</span>
          </button>

          <button class="m3-skip-vertical-btn" title="Skip" onClick={handleSkip}>
            <span class="material-symbols-rounded" style={{ fontSize: '28px' }}>skip_next</span>
          </button>
        </div>

        <div class="up-next-block">
          <span class="up-next-label">
            {isAr ? 'التالي (Up next)' : 'Up next'}
          </span>
          <div class="up-next-time">
            {nextStageMins}:{nextStageSecs}
          </div>
          <div class="up-next-title">
            {i18n.t(nextStage.titleKey)}
          </div>
        </div>

        <div class="task-link-selector" style={{ marginTop: '1.5rem', width: '100%', maxWidth: '340px', justifyContent: 'center' }}>
          <span class="material-symbols-rounded" style={{ fontSize: '19px', color: 'var(--m3-primary)' }}>task_alt</span>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            disabled={isRunning}
            style={{ background: 'transparent', border: 'none', color: 'inherit', fontFamily: 'inherit', fontWeight: '700', outline: 'none', width: '100%', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <option value="">{i18n.t('no_task_linked')}</option>
            {activeTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div class="timer-companion-cards">
        <div style={{ background: 'var(--m3-surface-low)', border: '1px solid var(--m3-outline)', borderRadius: '28px', padding: '1.35rem', boxShadow: 'var(--m3-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span class="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--m3-primary)' }}>schedule</span>
              <span>خطة الجلسات (Focus Cycle)</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--m3-text-muted)', fontWeight: '800' }}>
              الخطوة {currentStep} من 4
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            {FOCUS_CYCLE_STAGES.map((s) => {
              const isActive = (mode !== POMODORO_MODE.INFINITE && currentStep === s.step);
              let durationLabel = `${settings.focusTime || 25} دقيقة`;
              if (s.type === POMODORO_MODE.SHORT_BREAK) durationLabel = `${settings.shortBreakTime || 5} دقيقة`;
              if (s.type === POMODORO_MODE.LONG_BREAK) durationLabel = `${settings.longBreakTime || 15} دقيقة`;

              return (
                <div
                  key={s.step}
                  onClick={() => handleSelectStepDirectly(s.step)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '14px',
                    background: isActive ? 'var(--m3-primary-container)' : 'var(--m3-surface-container)',
                    color: isActive ? 'var(--m3-on-primary-container)' : 'var(--m3-text-main)',
                    fontWeight: isActive ? '800' : '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isActive ? '1.5px solid var(--m3-primary)' : '1px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: isActive ? 'var(--m3-primary)' : 'var(--m3-outline)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800' }}>
                      {s.step}
                    </span>
                    <span>{i18n.t(s.titleKey)} ({durationLabel})</span>
                  </div>
                  {isActive && <span class="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--m3-primary)' }}>play_circle</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'var(--m3-surface-low)', border: '1px solid var(--m3-outline)', borderRadius: '28px', padding: '1.35rem', boxShadow: 'var(--m3-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span class="material-symbols-rounded" style={{ fontSize: '20px', color: '#FFA000' }}>flag</span>
              <span>هدف التركيز اليومي</span>
            </h3>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--m3-primary)' }}>
              {todayFocusMins} / {dailyGoalMins} د ({goalProgressPercent}%)
            </span>
          </div>

          <div style={{ width: '100%', height: '10px', background: 'var(--m3-surface-container)', borderRadius: '999px', overflow: 'hidden', margin: '0.75rem 0' }}>
            <div style={{ width: `${goalProgressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--m3-primary), var(--m3-tertiary))', borderRadius: '999px', transition: 'width 0.4s ease' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--m3-text-muted)', fontWeight: '700' }}>
            <span>جلسات اليوم: {todaySessions.length}</span>
            <span>متبقي: {Math.max(0, dailyGoalMins - todayFocusMins)} دقيقة</span>
          </div>
        </div>

        {linkedTask && (
          <div style={{ background: 'var(--m3-surface-low)', border: '1px solid var(--m3-outline)', borderRadius: '28px', padding: '1.35rem', boxShadow: 'var(--m3-shadow-sm)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--m3-primary)' }}>
              <span class="material-symbols-rounded" style={{ fontSize: '20px' }}>checklist</span>
              <span>{linkedTask.title}</span>
            </h3>

            {linkedTask.subtasks && linkedTask.subtasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                {linkedTask.subtasks.map(st => (
                  <div
                    key={st.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}
                    onClick={() => handleToggleSubtask(linkedTask.id, st.id)}
                  >
                    <div class={`task-checkbox ${st.is_completed ? 'checked' : ''}`} style={{ width: '18px', height: '18px' }}>
                      {st.is_completed && <span class="material-symbols-rounded" style={{ fontSize: '14px' }}>check</span>}
                    </div>
                    <span style={{ textDecoration: st.is_completed ? 'line-through' : 'none', color: st.is_completed ? 'var(--m3-text-muted)' : 'inherit', fontWeight: '600' }}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--m3-text-muted)', marginTop: '0.4rem' }}>
                لا توجد مهام فرعية لهذه المهمة.
              </p>
            )}
          </div>
        )}
      </div>

      {isZenMode && (
        <div
          onClick={() => setIsZenMode(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--m3-bg)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: 'fadeInView 0.3s ease'
          }}
        >
          <div style={{ fontSize: '8rem', fontWeight: '900', letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(displayRemaining, mode === POMODORO_MODE.INFINITE ? displayElapsed : null)}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--m3-text-secondary)', marginTop: '1rem' }}>
            {i18n.t(mode)} • اضغط في أي مكان للخروج
          </div>
        </div>
      )}
    </div>
  );
}
