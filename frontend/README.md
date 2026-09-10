# LifeLoan Frontend

React + TypeScript + Vite frontend for LifeLoan Financial Intelligence.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set `VITE_API_URL` in `.env` if your backend runs on a non-default port:
   ```env
   VITE_API_URL="http://localhost:8000"
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

> **Security Note:** The Gemini API key is kept server-side only in `backend/.env`. The frontend communicates exclusively with the FastAPI backend.
