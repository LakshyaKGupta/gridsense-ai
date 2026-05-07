# Project Context

## Behavioral Guidelines

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- Present multiple interpretations if they exist - don't pick silently.
- Push back when warranted; suggest simpler approaches.
- Stop and name confusion before implementing.

### 2. Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- If 200 lines could be 50, rewrite it.

### 3. Surgical Changes
- Touch only what you must. Don't "improve" adjacent code.
- Match existing style, even if you'd do it differently.
- Remove imports/variables that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

### 4. Goal-Driven Execution
- Transform tasks into verifiable criteria.
- For multi-step tasks, state brief plan with verification checks.

---

## Project Info

### Goal
AI-based EV Charging Optimization & Infrastructure Planning for BESCOM Bengaluru hackathon. Predicts demand, optimizes charging schedules, recommends infrastructure locations.

### Architecture
- **Frontend**: React + Vite + TypeScript, deployed on Vercel
- **Backend**: Python FastAPI, deployed separately (optional - app works with fallback)
- **Map**: MapLibre GL with CARTO dark tiles (fallback if API fails)

### Key Features
- 4 dashboard tabs: insights (map), impact (predictions), planning (recommendations), metrics (evaluation)
- Explainability panel ("WHY THIS RECOMMENDATION")
- Baseline comparison (AI vs Uniform vs Random)
- Grid constraints visualization
- AI chatbot assistant
- Mobile-responsive PWA

### Critical Decisions
- App works standalone with fallback data - backend optional
- Vite proxy for backend calls (same origin)
- 8 fallback EV stations hardcoded in `stateEngine.ts`
- Impact tab uses real `zone.current_demand` data

### Known Issues
- Map tiles may return 403 if MapTiler API key missing
- Overpass API returns 406 - fallback stations used
- Backend 404 when not running - fallback works

### Deploy
```bash
npx vercel --prod
```
