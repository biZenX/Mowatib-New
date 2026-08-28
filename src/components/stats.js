// Mowatib - Responsive Material 3 Stats Component

import { i18n } from '../services/i18n.js';
import { storageService } from '../services/storage.js';
import { audioService } from '../services/audio.js';

export class StatsComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.isWeeklyExpanded = false;
  }

  render() {
    const today = storageService.getTodayStats();
    const todayFocusStr = this.formatMinsToHoursMins(today.focusMinutes || 0);
    const todayBreakStr = this.formatMinsToHoursMins(today.breakMinutes || 0);

    const weekData = storageService.getLastNDaysStats(7);
    const weekTotalMins = weekData.reduce((acc, d) => acc + (d.focusMinutes || 0), 0);
    const weekAvgMins = Math.round(weekTotalMins / 7);
    const weekAvgStr = this.formatMinsToHoursMins(weekAvgMins);

    const monthData = storageService.getLastNDaysStats(30);
    const monthTotalMins = monthData.reduce((acc, d) => acc + (d.focusMinutes || 0), 0);
    const monthAvgMins = Math.round(monthTotalMins / 30);
    const monthAvgStr = this.formatMinsToHoursMins(monthAvgMins);

    this.container.innerHTML = `
      <div class="stats-responsive-container">
        
        <h2 class="stats-page-header">${i18n.t('stats')}</h2>

        <!-- Top Section Grid (Desktop 2-column, Mobile 1-column) -->
        <div class="stats-grid-top">
          
          <!-- Today Cards -->
          <div class="stats-chart-card">
            <div class="stats-section-title">${i18n.t('today', 'Today', 'اليوم')}</div>
            <div class="today-cards-row">
              
              <!-- Focus Card -->
              <div class="today-card focus-card">
                <span class="today-card-label">${i18n.t('focus')}</span>
                <span class="today-card-val">${todayFocusStr}</span>
              </div>

              <!-- Break Card -->
              <div class="today-card break-card">
                <span class="today-card-label">${i18n.t('short_break')}</span>
                <span class="today-card-val">${todayBreakStr}</span>
              </div>

            </div>
          </div>

          <!-- Last Week Card -->
          <div class="stats-chart-card">
            <div class="stats-section-title">${i18n.t('last_7_days')}</div>
            <div class="stats-chart-header">
              <span class="stats-avg-val">${weekAvgStr}</span>
              <span class="stats-avg-desc">${i18n.t('focus_per_day_avg', 'focus per day (avg)', 'تركيز يومي (المعدل)')}</span>
            </div>

            <!-- 7-Day Stadium Chart -->
            ${this.renderWeekChart(weekData)}

            <!-- Expand / Collapse Button -->
            <button class="expand-toggle-btn" id="btn-toggle-week-analysis" title="Toggle Productivity Analysis">
              <span class="material-symbols-rounded">
                ${this.isWeeklyExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>

            <!-- Weekly Productivity Analysis (Screenshot 5) -->
            <div class="productivity-analysis-box ${this.isWeeklyExpanded ? 'show' : ''}">
              <div class="prod-title">${i18n.t('prod_analysis_title', 'Weekly productivity analysis', 'تحليل الإنتاجية الأسبوعية')}</div>
              <div class="prod-subtitle">${i18n.t('prod_analysis_sub', 'Focus durations at different times of the day', 'فترات التركيز في أوقات اليوم المختلفة')}</div>
              ${this.renderQuadrantBarChart(weekData)}
            </div>
          </div>

        </div>

        <!-- Last Month Full-Width Card -->
        <div class="stats-chart-card">
          <div class="stats-section-title">${i18n.t('last_30_days')}</div>
          <div class="stats-chart-header">
            <span class="stats-avg-val">${monthAvgStr}</span>
            <span class="stats-avg-desc">${i18n.t('focus_per_day_avg', 'focus per day (avg)', 'تركيز يومي (المعدل)')}</span>
          </div>

          <!-- 30-Day Stadium Chart -->
          ${this.renderMonthChart(monthData)}
        </div>

        <!-- Demo Stats Button -->
        <div style="display:flex; justify-content:center; margin-top:0.5rem;">
          <button class="m3-action-btn" id="btn-demo-stats" style="padding: 0.65rem 1.4rem; font-size: 0.95rem;">
            <span class="material-symbols-rounded" style="font-size:20px;">auto_fix_high</span>
            ${i18n.t('generate_sample')}
          </button>
        </div>

      </div>
    `;

    this.bindEvents();
  }

  formatMinsToHoursMins(mins) {
    if (mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  renderWeekChart(weekData) {
    const maxVal = Math.max(...weekData.map(d => d.focusMinutes), 540);
    const chartHeight = 130;
    const chartWidth = 360;
    const leftMargin = 32;
    const availableWidth = chartWidth - leftMargin;
    const colWidth = 28;
    const gap = (availableWidth - weekData.length * colWidth) / (weekData.length + 1);

    const cols = weekData.map((d, i) => {
      const colHeight = Math.max(16, (d.focusMinutes / maxVal) * chartHeight);
      const x = leftMargin + gap + i * (colWidth + gap);
      const y = chartHeight - colHeight + 10;
      const dayLetter = d.dayOfWeek.charAt(0);

      return `
        <g>
          <rect 
            x="${x}" 
            y="${y}" 
            width="${colWidth}" 
            height="${colHeight}" 
            rx="14" 
            fill="var(--m3-primary)" 
            opacity="${d.focusMinutes > 0 ? '1' : '0.15'}"
          />
          <text 
            x="${x + colWidth / 2}" 
            y="${chartHeight + 32}" 
            text-anchor="middle" 
            fill="var(--m3-text-secondary)" 
            font-size="12" 
            font-weight="700"
          >${dayLetter}</text>
        </g>
      `;
    }).join('');

    return `
      <div class="m3-chart-svg-wrap">
        <svg class="m3-chart-svg" viewBox="0 0 ${chartWidth} 170" preserveAspectRatio="none">
          <text x="0" y="18" fill="var(--m3-text-muted)" font-size="11" font-weight="600">9h</text>
          <text x="0" y="62" fill="var(--m3-text-muted)" font-size="11" font-weight="600">6h</text>
          <text x="0" y="106" fill="var(--m3-text-muted)" font-size="11" font-weight="600">3h</text>
          <text x="0" y="146" fill="var(--m3-text-muted)" font-size="11" font-weight="600">0h</text>
          ${cols}
        </svg>
      </div>
    `;
  }

  renderQuadrantBarChart(weekData) {
    let q1 = 0, q2 = 0, q3 = 0, q4 = 0;
    weekData.forEach(d => {
      q1 += d.q1 || 0;
      q2 += d.q2 || 0;
      q3 += d.q3 || 0;
      q4 += d.q4 || 0;
    });

    const quadrants = [
      { label: '0 - 6', mins: Math.round(q1 / 7) },
      { label: '6 - 12', mins: Math.round(q2 / 7) },
      { label: '12 - 18', mins: Math.round(q3 / 7) },
      { label: '18 - 24', mins: Math.round(q4 / 7) }
    ];

    const maxVal = Math.max(...quadrants.map(q => q.mins), 180);
    const chartHeight = 130;
    const chartWidth = 360;
    const leftMargin = 50;
    const availableWidth = chartWidth - leftMargin;
    const colWidth = 32;
    const gap = (availableWidth - quadrants.length * colWidth) / (quadrants.length + 1);

    const cols = quadrants.map((q, i) => {
      const colHeight = Math.max(16, (q.mins / maxVal) * chartHeight);
      const x = leftMargin + gap + i * (colWidth + gap);
      const y = chartHeight - colHeight + 10;

      return `
        <g>
          <rect 
            x="${x}" 
            y="${y}" 
            width="${colWidth}" 
            height="${colHeight}" 
            rx="16" 
            fill="var(--m3-primary)" 
            opacity="${q.mins > 0 ? '1' : '0.15'}"
          />
          <text 
            x="${x + colWidth / 2}" 
            y="${chartHeight + 32}" 
            text-anchor="middle" 
            fill="var(--m3-text-secondary)" 
            font-size="11" 
            font-weight="700"
          >${q.label}</text>
        </g>
      `;
    }).join('');

    return `
      <div class="m3-chart-svg-wrap">
        <svg class="m3-chart-svg" viewBox="0 0 ${chartWidth} 170" preserveAspectRatio="none">
          <text x="0" y="18" fill="var(--m3-text-muted)" font-size="10">2h 38m</text>
          <text x="0" y="44" fill="var(--m3-text-muted)" font-size="10">2h 6m</text>
          <text x="0" y="70" fill="var(--m3-text-muted)" font-size="10">1h 35m</text>
          <text x="0" y="96" fill="var(--m3-text-muted)" font-size="10">1h 3m</text>
          <text x="0" y="122" fill="var(--m3-text-muted)" font-size="10">0h 31m</text>
          <text x="0" y="146" fill="var(--m3-text-muted)" font-size="10">0h 0m</text>
          ${cols}
        </svg>
      </div>
    `;
  }

  renderMonthChart(monthData) {
    const maxVal = Math.max(...monthData.map(d => d.focusMinutes), 540);
    const chartHeight = 130;
    const chartWidth = 600;
    const leftMargin = 32;
    const availableWidth = chartWidth - leftMargin;
    const colWidth = 11;
    const gap = (availableWidth - monthData.length * colWidth) / (monthData.length + 1);

    const cols = monthData.map((d, i) => {
      const colHeight = Math.max(8, (d.focusMinutes / maxVal) * chartHeight);
      const x = leftMargin + gap + i * (colWidth + gap);
      const y = chartHeight - colHeight + 10;
      const showLabel = i % 2 === 0;

      return `
        <g>
          <rect 
            x="${x}" 
            y="${y}" 
            width="${colWidth}" 
            height="${colHeight}" 
            rx="5" 
            fill="var(--m3-primary)" 
            opacity="${d.focusMinutes > 0 ? '1' : '0.15'}"
          />
          ${showLabel ? `
            <text 
              x="${x + colWidth / 2}" 
              y="${chartHeight + 30}" 
              text-anchor="middle" 
              fill="var(--m3-text-muted)" 
              font-size="10" 
              font-weight="600"
            >${d.dayOfMonth}</text>
          ` : ''}
        </g>
      `;
    }).join('');

    return `
      <div class="m3-chart-svg-wrap">
        <svg class="m3-chart-svg" viewBox="0 0 ${chartWidth} 170" preserveAspectRatio="none">
          <text x="0" y="18" fill="var(--m3-text-muted)" font-size="11" font-weight="600">9h</text>
          <text x="0" y="78" fill="var(--m3-text-muted)" font-size="11" font-weight="600">6h</text>
          <text x="0" y="146" fill="var(--m3-text-muted)" font-size="11" font-weight="600">0h</text>
          ${cols}
        </svg>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('btn-toggle-week-analysis')?.addEventListener('click', () => {
      audioService.playClick();
      this.isWeeklyExpanded = !this.isWeeklyExpanded;
      this.render();
    });

    document.getElementById('btn-demo-stats')?.addEventListener('click', () => {
      audioService.playClick();
      storageService.generateSampleData();
      this.render();
    });
  }
}
