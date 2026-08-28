# Mowatib (مواظب) - Web Edition

> **Mowatib** (**مواظب** / *Mwazeb*) is a modern, responsive, and aesthetic Pomodoro focus web application inspired by Tomato, designed for desktop, iPad/tablet, and mobile phones.

---

## 🌟 Key Features

### 1. 🎯 Precision Focus & Pomodoro Engine
- **Modes**: Focus (25m), Short Break (5m), Long Break (15m), and **Infinite Focus** (Count-up stopwatch for deep flow states).
- **Session Pipeline**: Configurable cycle length (e.g. 4 sessions) with interactive visual schedule and "Up Next" progress tracking.
- **Dynamic Circular Progress**: Smooth animated SVG circular dial with sinusoidal wavy indicator during breaks.
- **Action Controls**: Play, Pause, Reset (with a 5-second **Undo** notification toast), and Skip to Next.

### 2. 📱 Ultra-Responsive Multi-Device Layout
- **Desktop (1024px+)**: Two-column layout with centered focus dial and side pane schedule/widgets.
- **iPad & Tablets (768px - 1024px)**: Fluid adaptive layout with touch targets.
- **Mobile Phones (< 768px)**: Native app experience with bottom navigation bar, compact controls, and haptic feedback.

### 3. 🌐 Seamless English & Arabic (RTL) Support
- Instant bilingual toggle with full Right-to-Left (RTL) layout mirroring.
- Custom typography: **Outfit** & **Plus Jakarta Sans** for Latin; **Tajawal** & **Cairo** for Arabic.

### 4. 📊 Deep Analytics & Visual Charts
- Today's focus summary vs Daily Goal.
- **Time-of-Day Breakdown**: Quadrants Q1 (Night), Q2 (Morning), Q3 (Afternoon), Q4 (Evening).
- **Interactive Charts**: Last 7 Days, Last 30 Days, and full **365-Day Contribution Heatmap**.
- **Demo Data Generator**: One-click demo data generation for testing analytics.

### 5. 🎨 Expressive Themes & Palettes
- **Themes**: Dark Slate, AMOLED Pure Black (`#000000`), and Clean Light.
- **Palettes**: Tomato Crimson, Emerald Mint, Ocean Azure, Royal Violet, Amber Sunset, and Rose Quartz.

### 6. 🔔 Audio & Ambient Modes
- **Offline Web Audio Synthesizer**: Zen Singing Bowl, Crystal Bell, Soft Marimba, Meditative Gong, and Digital Beep (no external mp3 files required).
- **Always-on-Display (AOD) Zen Mode**: Fullscreen minimalist clock with screen wake-lock.
- **Backup & Restore**: Export and Import JSON data files.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd web
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Build for Production
```bash
npm run build
```
The optimized bundle will be in the `web/dist/` directory, ready to deploy to Vercel, Netlify, Cloudflare Pages, or any static web host.

---

## ⌨️ Keyboard Shortcuts
- `Space`: Start / Pause Timer
- `R`: Reset Timer (with Undo option)
- `S`: Skip to Next Session
- `F`: Toggle Fullscreen Ambient Zen Mode (Press `Esc` to exit)
- `1`: Switch to Timer View
- `2`: Switch to Statistics View
- `3`: Switch to Settings View
# Mowatib-New
