# LastKey Digital Legacy

Full-stack MERN app for digital legacy management.

## Structure
- `client/` - Vite + React + Tailwind frontend
- `server/` - Node/Express + MongoDB backend

## Setup

1. **MongoDB**: Sign up Atlas or run local. Copy URI to `server/.env` (from .env.example)

2. **Backend**:
```
cd server
npm install
npm run dev
```
Port: 5000. Test: http://localhost:5000/api/health

3. **Frontend** (new terminal):
```
cd client
npm install
npm run dev
```
Port: 5173

## Features
- Home page (frontend)
- API health check (backend)
- Expand models/routes for legacy features

Happy coding!
