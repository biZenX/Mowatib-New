// Mowatib - Always-on-Display (AOD) Zen Mode

import { i18n } from '../services/i18n.js';
import { notificationService } from '../services/notifications.js';

export class AodComponent {
  constructor(overlayId) {
    this.overlay = document.getElementById(overlayId);
    this.isActive = false;
    this.currentTimeStr = '25:00';
    this.currentMode = 'Focus';
  }

  show(timeStr, modeLabel) {
    this.isActive = true;
    this.currentTimeStr = timeStr;
    this.currentMode = modeLabel;
    notificationService.requestWakeLock();

    this.overlay.classList.remove('hidden');
    this.render();

    // Request browser fullscreen if available
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}
  }

  hide() {
    this.isActive = false;
    this.overlay.classList.add('hidden');
    notificationService.releaseWakeLock();

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  }

  updateTime(timeStr, modeLabel) {
    this.currentTimeStr = timeStr;
    this.currentMode = modeLabel;
    if (this.isActive) {
      const clock = document.getElementById('aod-clock-text');
      if (clock) clock.textContent = timeStr;
    }
  }

  render() {
    this.overlay.innerHTML = `
      <div class="aod-clock" id="aod-clock-text">${this.currentTimeStr}</div>
      <div class="aod-badge">
        <span class="material-symbols-rounded">psychology</span>
        <span>${this.currentMode}</span>
      </div>
      <div class="aod-hint">${i18n.t('press_to_exit_aod')}</div>
    `;

    this.overlay.onclick = () => {
      this.hide();
    };

    window.onkeydown = (e) => {
      if (this.isActive && (e.key === 'Escape' || e.key === 'f' || e.key === 'F')) {
        this.hide();
      }
    };
  }
}
