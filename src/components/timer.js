// Mowatib - Responsive Material 3 Timer Component

import { i18n } from '../services/i18n.js';
import { storageService } from '../services/storage.js';
import { audioService } from '../services/audio.js';
import { notificationService } from '../services/notifications.js';

export const TIMER_MODES = {
  FOCUS: 'FOCUS',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK'
};

const RADIUS = 135;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~848.23

export class TimerComponent {
  constructor(containerId, onStateChange) {
    this.container = document.getElementById(containerId);
    this.onStateChange = onStateChange;

    this.mode = TIMER_MODES.FOCUS;
    this.isRunning = false;
    this.currentSession = 1;
    this.remainingSeconds = storageService.settings.focusTime * 60;
    this.totalSeconds = storageService.settings.focusTime * 60;
    this.intervalId = null;

    this.undoSnapshot = null;
    this.undoTimeout = null;

    this.init();
  }

  init() {
    this.updateDurationsFromSettings();
  }

  updateDurationsFromSettings() {
    const s = storageService.settings;
    if (!this.isRunning) {
      if (this.mode === TIMER_MODES.FOCUS) {
        this.totalSeconds = s.focusTime * 60;
      } else if (this.mode === TIMER_MODES.SHORT_BREAK) {
        this.totalSeconds = s.shortBreakTime * 60;
      } else {
        this.totalSeconds = s.longBreakTime * 60;
      }
      this.remainingSeconds = this.totalSeconds;
    }
  }

  render() {
    const s = storageService.settings;
    const isBreak = this.mode !== TIMER_MODES.FOCUS;
    const timeStr = this.getFormattedTime();
    const sessionText = `${this.currentSession} of ${s.sessionLength}`;
    const sessionTextAr = `${this.currentSession} من ${s.sessionLength}`;
    
    // Up Next calculation
    const upNext = this.getUpNextInfo();

    // Progress calculations
    const progressFraction = this.totalSeconds > 0 ? (this.totalSeconds - this.remainingSeconds) / this.totalSeconds : 0;
    const progressOffset = CIRCUMFERENCE * (1 - progressFraction);
    const wavyPath = isBreak ? this.generateWavyPath(progressFraction) : '';

    this.container.innerHTML = `
      <div class="timer-responsive-grid">
        
        <!-- Primary Hero Timer Column -->
        <div class="timer-hero-pane">
          
          <!-- Center Circular Dial -->
          <div class="dial-box ${isBreak ? 'break-state' : ''}" id="main-timer-dial">
            <svg class="dial-svg" viewBox="0 0 320 320">
              <circle class="track-circle" cx="160" cy="160" r="${RADIUS}" />
              ${!isBreak ? `
                <circle 
                  class="progress-arc" 
                  id="timer-progress-arc"
                  cx="160" 
                  cy="160" 
                  r="${RADIUS}" 
                  style="stroke-dasharray: ${CIRCUMFERENCE}; stroke-dashoffset: ${progressOffset};"
                />
              ` : `
                <path 
                  class="progress-wavy-path" 
                  id="timer-wavy-path"
                  d="${wavyPath}"
                />
              `}
            </svg>

            <div class="clock-center-group">
              <div class="clock-digits" id="clock-display-text">${timeStr}</div>
              <div class="session-badge-text">${i18n.currentLang === 'ar' ? sessionTextAr : sessionText}</div>
            </div>
          </div>

          <!-- M3 Expressive Button Group (124x84, 84x84, 68x84) -->
          <div class="m3-button-group">
            
            <!-- Play / Pause Button -->
            <button class="m3-btn btn-play-pause ${this.isRunning ? 'running' : ''}" id="btn-timer-toggle" title="${this.isRunning ? 'Pause' : 'Start'}">
              <span class="material-symbols-rounded">
                ${this.isRunning ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <!-- Reset Button -->
            <button class="m3-btn btn-reset" id="btn-timer-reset" title="Reset">
              <span class="material-symbols-rounded">replay</span>
            </button>

            <!-- Skip Next Button -->
            <button class="m3-btn btn-skip" id="btn-timer-skip" title="Skip">
              <span class="material-symbols-rounded">skip_next</span>
            </button>

          </div>

          <!-- Compact Up Next Widget (Mobile & Tablet) -->
          <div class="up-next-compact">
            <div class="up-next-sublabel">${i18n.t('up_next')}</div>
            <div class="up-next-bigtime">${upNext.time}</div>
            <div class="up-next-modename">${upNext.label}</div>
          </div>

        </div>

        <!-- Supporting Side Pane (Desktop / Tablet Multi-Pane Timeline) -->
        <div class="timer-supporting-pane">
          <div class="supporting-header">
            <span class="supporting-title">${i18n.t('up_next')}</span>
            <span style="font-size:0.9rem; font-weight:700; color:var(--m3-primary);">${s.sessionLength} ${i18n.t('focus')} Cycles</span>
          </div>

          <div class="schedule-stepper-list">
            ${this.renderTimelineItems()}
          </div>
        </div>

      </div>
    `;

    this.updateHeaderTitle();
    this.bindEvents();
  }

  renderTimelineItems() {
    const s = storageService.settings;
    const items = [];

    for (let i = 1; i <= s.sessionLength; i++) {
      const isDone = i < this.currentSession;
      const isCurrentFocus = i === this.currentSession && this.mode === TIMER_MODES.FOCUS;
      const isCurrentBreak = i === this.currentSession && (this.mode === TIMER_MODES.SHORT_BREAK || this.mode === TIMER_MODES.LONG_BREAK);

      // Focus session
      items.push(`
        <div class="stepper-item ${isCurrentFocus ? 'current' : ''} ${isDone ? 'done' : ''}">
          <div class="stepper-left">
            <span class="material-symbols-rounded stepper-icon">
              ${isDone ? 'check_circle' : isCurrentFocus ? 'hourglass_top' : 'radio_button_unchecked'}
            </span>
            <div>
              <div style="font-size:1rem; font-weight:700;">${i18n.t('focus')} ${i}</div>
              <div style="font-size:0.8rem; color:var(--m3-text-muted);">${s.focusTime} ${i18n.t('min')}</div>
            </div>
          </div>
          <span style="font-size:0.85rem; font-weight:700;">#${i}</span>
        </div>
      `);

      // Break item
      if (i < s.sessionLength) {
        items.push(`
          <div class="stepper-item ${isCurrentBreak ? 'current' : ''} ${isDone ? 'done' : ''}" style="border-left: 3px solid var(--m3-tertiary);">
            <div class="stepper-left">
              <span class="material-symbols-rounded stepper-icon" style="color:var(--m3-tertiary);">coffee</span>
              <div>
                <div style="font-size:0.95rem; font-weight:700;">${i18n.t('short_break')}</div>
                <div style="font-size:0.8rem; color:var(--m3-text-muted);">${s.shortBreakTime} ${i18n.t('min')}</div>
              </div>
            </div>
            <span style="font-size:0.85rem; font-weight:700; color:var(--m3-tertiary);">${s.shortBreakTime}m</span>
          </div>
        `);
      } else {
        // Final Long Break
        items.push(`
          <div class="stepper-item ${isCurrentBreak && this.mode === TIMER_MODES.LONG_BREAK ? 'current' : ''}" style="border-left: 3px solid #a855f7;">
            <div class="stepper-left">
              <span class="material-symbols-rounded stepper-icon" style="color:#a855f7;">self_improvement</span>
              <div>
                <div style="font-size:0.95rem; font-weight:700;">${i18n.t('long_break')}</div>
                <div style="font-size:0.8rem; color:var(--m3-text-muted);">${s.longBreakTime} ${i18n.t('min')}</div>
              </div>
            </div>
            <span style="font-size:0.85rem; font-weight:700; color:#a855f7;">${s.longBreakTime}m</span>
          </div>
        `);
      }
    }

    return items.join('');
  }

  generateWavyPath(progress) {
    if (progress <= 0.001) return '';
    const cx = 160;
    const cy = 160;
    const rBase = RADIUS;
    const amp = 9.0;
    const numWaves = 18;
    const maxAngle = progress * 2 * Math.PI;
    const step = 0.02;

    const points = [];
    for (let theta = 0; theta <= maxAngle; theta += step) {
      const r = rBase + amp * Math.sin(numWaves * theta);
      const x = cx + r * Math.sin(theta);
      const y = cy - r * Math.cos(theta);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    if (points.length === 0) return '';
    return `M ${points[0]} L ${points.slice(1).join(' L ')}`;
  }

  getUpNextInfo() {
    const s = storageService.settings;
    if (this.mode === TIMER_MODES.FOCUS) {
      if (this.currentSession < s.sessionLength) {
        return {
          time: `${s.shortBreakTime.toString().padStart(2, '0')}:00`,
          label: i18n.t('short_break')
        };
      } else {
        return {
          time: `${s.longBreakTime.toString().padStart(2, '0')}:00`,
          label: i18n.t('long_break')
        };
      }
    } else {
      return {
        time: `${s.focusTime.toString().padStart(2, '0')}:00`,
        label: i18n.t('focus')
      };
    }
  }

  updateHeaderTitle() {
    const titleEl = document.getElementById('main-header-title');
    if (!titleEl) return;

    if (!this.isRunning) {
      titleEl.textContent = i18n.currentLang === 'ar' ? 'مواظب' : 'Mowatib';
      titleEl.className = 'brand-title';
    } else if (this.mode === TIMER_MODES.FOCUS) {
      titleEl.textContent = i18n.t('focus');
      titleEl.className = 'brand-title focus-mode';
    } else if (this.mode === TIMER_MODES.SHORT_BREAK) {
      titleEl.textContent = i18n.t('short_break');
      titleEl.className = 'brand-title break-mode';
    } else {
      titleEl.textContent = i18n.t('long_break');
      titleEl.className = 'brand-title break-mode';
    }
  }

  bindEvents() {
    document.getElementById('btn-timer-toggle')?.addEventListener('click', () => {
      audioService.playClick();
      this.toggleTimer();
    });

    document.getElementById('btn-timer-reset')?.addEventListener('click', () => {
      audioService.playClick();
      this.resetTimer();
    });

    document.getElementById('btn-timer-skip')?.addEventListener('click', () => {
      audioService.playClick();
      this.skipNext();
    });
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    notificationService.requestWakeLock();
    notificationService.requestPermission();

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.render();
    this.notifyState();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.intervalId = null;
    notificationService.releaseWakeLock();

    this.render();
    this.notifyState();
  }

  tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds -= 1;
      this.updateDisplayFast();
    } else {
      this.onSessionComplete();
    }
  }

  updateDisplayFast() {
    const timeStr = this.getFormattedTime();
    const clockEl = document.getElementById('clock-display-text');
    if (clockEl) clockEl.textContent = timeStr;

    const progressFraction = this.totalSeconds > 0 ? (this.totalSeconds - this.remainingSeconds) / this.totalSeconds : 0;
    
    if (this.mode === TIMER_MODES.FOCUS) {
      const arc = document.getElementById('timer-progress-arc');
      if (arc) {
        arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - progressFraction);
      }
    } else {
      const wavyPath = document.getElementById('timer-wavy-path');
      if (wavyPath) {
        wavyPath.setAttribute('d', this.generateWavyPath(progressFraction));
      }
    }

    notificationService.updateTitle(timeStr, this.mode === TIMER_MODES.FOCUS ? i18n.t('focus') : i18n.t('short_break'), this.isRunning);
    this.notifyState();
  }

  onSessionComplete() {
    this.pause();
    const s = storageService.settings;

    if (s.alarmEnabled) {
      audioService.playAlarm(s.alarmSound, s.alarmVolume);
    }
    if (s.vibrateEnabled) {
      notificationService.vibrate();
    }

    if (this.mode === TIMER_MODES.FOCUS) {
      storageService.recordFocusSession(s.focusTime);
      notificationService.notify(i18n.t('focus') + ' Done!', {
        body: i18n.t('session_finished_focus')
      });

      if (this.currentSession < s.sessionLength) {
        this.mode = TIMER_MODES.SHORT_BREAK;
        this.totalSeconds = s.shortBreakTime * 60;
      } else {
        this.mode = TIMER_MODES.LONG_BREAK;
        this.totalSeconds = s.longBreakTime * 60;
      }
    } else {
      const dur = this.mode === TIMER_MODES.SHORT_BREAK ? s.shortBreakTime : s.longBreakTime;
      storageService.recordBreak(dur);
      notificationService.notify(i18n.t('short_break') + ' Ended', {
        body: i18n.t('session_finished_break')
      });

      if (this.mode === TIMER_MODES.SHORT_BREAK) {
        this.currentSession += 1;
      } else {
        this.currentSession = 1;
      }

      this.mode = TIMER_MODES.FOCUS;
      this.totalSeconds = s.focusTime * 60;
    }

    this.remainingSeconds = this.totalSeconds;
    this.render();
    window.dispatchEvent(new CustomEvent('mowatib:statsUpdated'));

    if (s.autostartNextSession) {
      setTimeout(() => this.start(), 1000);
    }
  }

  resetTimer() {
    this.undoSnapshot = {
      mode: this.mode,
      remainingSeconds: this.remainingSeconds,
      totalSeconds: this.totalSeconds,
      currentSession: this.currentSession,
      wasRunning: this.isRunning
    };

    this.pause();
    this.remainingSeconds = this.totalSeconds;
    this.render();
    this.showUndoToast();
    this.notifyState();
  }

  showUndoToast() {
    const container = document.getElementById('toast-layer');
    if (!container) return;

    if (this.undoTimeout) clearTimeout(this.undoTimeout);
    container.innerHTML = `
      <div class="m3-toast">
        <span>${i18n.t('reset_toast_msg')}</span>
        <button class="m3-toast-undo" id="btn-undo-action">${i18n.t('undo')}</button>
      </div>
    `;

    document.getElementById('btn-undo-action')?.addEventListener('click', () => {
      this.restoreUndo();
    });

    this.undoTimeout = setTimeout(() => {
      container.innerHTML = '';
      this.undoSnapshot = null;
    }, 5000);
  }

  restoreUndo() {
    if (!this.undoSnapshot) return;
    this.mode = this.undoSnapshot.mode;
    this.remainingSeconds = this.undoSnapshot.remainingSeconds;
    this.totalSeconds = this.undoSnapshot.totalSeconds;
    this.currentSession = this.undoSnapshot.currentSession;
    const wasRunning = this.undoSnapshot.wasRunning;

    const container = document.getElementById('toast-layer');
    if (container) container.innerHTML = '';
    this.undoSnapshot = null;

    this.render();
    if (wasRunning) this.start();
    this.notifyState();
  }

  skipNext() {
    this.pause();
    const s = storageService.settings;

    if (this.mode === TIMER_MODES.FOCUS) {
      if (this.currentSession < s.sessionLength) {
        this.mode = TIMER_MODES.SHORT_BREAK;
        this.totalSeconds = s.shortBreakTime * 60;
      } else {
        this.mode = TIMER_MODES.LONG_BREAK;
        this.totalSeconds = s.longBreakTime * 60;
      }
    } else if (this.mode === TIMER_MODES.SHORT_BREAK) {
      this.currentSession += 1;
      this.mode = TIMER_MODES.FOCUS;
      this.totalSeconds = s.focusTime * 60;
    } else {
      this.currentSession = 1;
      this.mode = TIMER_MODES.FOCUS;
      this.totalSeconds = s.focusTime * 60;
    }

    this.remainingSeconds = this.totalSeconds;
    this.render();
    this.notifyState();
  }

  getFormattedTime() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        mode: this.mode,
        timeStr: this.getFormattedTime(),
        isRunning: this.isRunning,
        currentSession: this.currentSession
      });
    }
  }
}
