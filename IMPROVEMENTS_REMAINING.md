# GridSense AI — Improvements & Remaining Tasks
> Action Plan for Production Deployment and Hackathon Demo

## ✅ Recently Resolved
- **Operator Dashboard Runtime Stability**: Fixed fatal frontend rendering crashes caused by strict typing mismatches and missing fields in the API payload fallback. The dashboard now gracefully handles backend timeouts/errors with a fully compliant, robust mock data structure.
- **Authentication Flow Restored**: Resolved a looping issue in the mock AuthContext bypass that broke the demo login path. Removed unsafe component-level console logs.

## 1. High-Priority Improvements (Demo Ready Polish)

### 1.1 Connect Planning Tab to Backend Logic
- **Current State:** The Planning tab on the Operator dashboard uses client-side calculations and generic heuristics for zone scoring.
- **Improvement:** Connect the UI to the backend `/locations/` and `/optimize/` endpoints to fetch actual OR-Tools LP solver recommendations and K-Means spatial analysis data.

### 1.2 Standardize Station Data Sources
- **Current State:** The frontend fallback state uses realistic named stations (Tata Power, Ather Grid, ChargeZone), but the backend `/ev/stations` simulation route uses generic synthetic names ("Station A1 Hub").
- **Improvement:** Update the backend simulation data to use the same realistic, named stations. This ensures a completely seamless visual transition between "Offline/Demo Mode" and the "Live AI Mode".

### 1.3 Interactive Scenario Switcher
- **Current State:** The backend has an active `/ev/scenario` endpoint to simulate grid events (e.g., `evening_peak`, `station_outage`), but there is no UI component to trigger these state changes.
- **Improvement:** Add a "Simulate Scenario" dropdown/button group in the Operator Dashboard. This is crucial for the Hackathon pitch to instantly demonstrate how the XGBoost model reacts to grid stress events and updates predictions in real-time.

## 2. Production Deployment & Architecture

### 2.1 Backend Cloud Deployment
- **Current State:** The FastAPI backend and SQLite database only run on the local machine (`localhost:8000`). The Vercel deployment is frontend-only and relies entirely on hardcoded fallback data.
- **Improvement:** Deploy the FastAPI backend to a cloud provider like **Render** or **Railway**. Once deployed, update the `VITE_API_URL` environment variable in the Vercel dashboard to point to the live backend URL.

### 2.2 Database Migration (SQLite -> PostgreSQL)
- **Current State:** Uses a local SQLite database (`ev_charging.db`) for tracking logs and sessions.
- **Improvement:** Migrate to a managed PostgreSQL database (e.g., Supabase, Neon) for robust production persistence. The existing SQLAlchemy models are already compatible and just require a `DATABASE_URL` connection string update.

### 2.3 Redis Caching Integration
- **Current State:** The codebase attempts to use Redis for prediction caching via utilities, but silently falls back to basic execution if a Redis server isn't running.
- **Improvement:** Provision a Redis instance (Upstash or Redis Cloud) and configure the backend cache. This will drastically reduce redundant XGBoost inference calls and speed up the Operator's 3-second polling interval.

## 3. Stretch Goals & Future AI Upgrades

### 3.1 Advanced Time-Series Modeling (Prophet / LSTM)
- **Current State:** Uses XGBoost, which is highly effective for point predictions based on environmental features, but lacks strong sequential memory for complex forecasting.
- **Improvement:** Implement a hybrid Prophet + LSTM model (as originally scoped in the system design) to better capture complex, long-term seasonal trends, holidays, and deep temporal dependencies.

### 3.2 Visual Data Overlays (Dynamic Heatmaps)
- **Current State:** MapLibre GL currently shows discrete circular markers for stations and zones.
- **Improvement:** Implement real heatmaps / density layers using MapLibre's heatmap capabilities to visualize grid stress across Bengaluru organically, providing a highly premium aesthetic for the Operator Dashboard.

### 3.3 Automated Reports & Push Alerts
- **Current State:** Alerts are shown in a localized UI banner on the dashboard. No report export functionality exists.
- **Improvement:** Add a PDF export feature for daily Grid Assessment Reports using `jsPDF` or a headless browser service. Implement email or SMS push notifications via Firebase/Twilio for critical "RED" grid overload events.
