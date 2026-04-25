# Vercel Deployment Guide

## Frontend (this repo)
1. Push to GitHub
2. Import at https://vercel.com/import
3. Framework: Vite
4. Build command: npm run build
5. Output directory: dist
6. Environment Variables:
   - VITE_API_URL = your-render-backend-url.onrender.com (optional - uses fallback if not set)

## Backend (separate)
Deploy backend to Render/Railway/Fly.io:
1. Create Python app
2. Port: 8000  
3. Start: python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
4. Add environment: PYTHON_VERSION=3.11

## Env vars in .env:
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=https://your-backend.onrender.com (optional)