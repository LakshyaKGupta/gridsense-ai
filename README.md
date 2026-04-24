# GridSense AI

> **BESCOM AI-Powered EV Charging Optimization & Infrastructure Planning System**  
> Version 1.0 · Status: Active · April 2026 · BESCOM EV Track

---

## Overview

GridSense AI is an AI-powered decision-support platform that predicts EV charging demand, recommends optimal charging schedules, and identifies priority zones for new charging infrastructure — operating entirely as a non-invasive overlay on existing BESCOM systems with **zero modification to distribution infrastructure**.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Visit **http://localhost:5173** after running `npm run dev`.

---

## Project Structure

```
gridsense-ai/
├── public/
│   └── hero.mp4              # Hero background animation
├── src/
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   ├── App.tsx               # Main application
│   ├── main.tsx              # React entry point
│   └── index.css             # Design system & global styles
├── docs/
│   └── PRD_TRD.md            # Full Product & Technical Requirements
├── index.html                # HTML shell with SEO meta tags
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies & scripts
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Vanilla CSS design system |
| Maps | Leaflet.js (planned) |
| Charts | Recharts + D3.js (planned) |
| Animations | CSS keyframes + Intersection Observer |
| Fonts | Inter · JetBrains Mono (Google Fonts) |

---

## Key Features

- **Full-screen video hero** — muted, looped, with cinematic gradient masking
- **Demand Forecasting** — Hybrid Prophet + LSTM, ≤15% MAPE target
- **Smart Scheduling** — LP optimizer, ≥20% peak load reduction
- **Infrastructure Planner** — K-Means + DBSCAN spatial clustering
- **Operator Dashboard** — Zone drill-down, heatmaps, PDF export
- **Zero hardware changes** — Pure decision-support overlay

---

## License

Confidential — BESCOM EV Hackathon 2026. All rights reserved.
