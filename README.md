# 🍽️ Restaurant Picker

A real-time group restaurant decision app. Users join a shared room, each picks their cuisine preference, price range, and area — then the app queries **Google Places API** and returns a ranked top-5 list that best matches everyone's combined preferences.

---

## Features

- **Rooms** — create or join by a 5-character code; share it with friends
- **Real-time sync** — powered by Socket.io; everyone sees who's ready
- **Preference voting** — each user picks cuisine, price range ($–$$$$), and area
- **Smart ranking** — composite score based on rating, popularity, and price match
- **Google Maps integration** — live restaurant data with photos and Maps links

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express, Socket.io |
| Restaurant data | Google Places API (Text Search) |

---

## Prerequisites

- **Node.js 18+**
- A **Google Maps API key** with the _Places API_ enabled  
  → [Get one here](https://developers.google.com/maps/documentation/places/web-service/get-api-key)

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo-url>
cd restaurant-picker

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Configure the API key

```bash
cd server
cp .env.example .env
# Open .env and set your key:
# GOOGLE_MAPS_API_KEY=AIza...
```

### 3. Run in development

Open **two terminals**:

**Terminal 1 — server:**
```bash
cd restaurant-picker/server
npm run dev
# Listening on http://localhost:3001
```

**Terminal 2 — client:**
```bash
cd restaurant-picker/client
npm run dev
# Vite dev server at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## How to use

1. Enter your name and click **Create Room** (or join with a code)
2. Share the room code with friends — they open the same URL and **Join Room**
3. Each person selects their **cuisine**, **price range**, and **area**
4. Once everyone submits, the app queries Google Places and shows the **Top 5 restaurants**
5. Click **View on Google Maps** for directions, reviews, and hours
6. Hit **New round** to vote again

---

## Deployment

### Backend
Deploy the `server/` folder to any Node.js host (Railway, Render, Fly.io, etc.).  
Set the `GOOGLE_MAPS_API_KEY` environment variable there.

### Frontend
Set `VITE_SERVER_URL` in a `.env` file in `client/` to point to your deployed server:
```
VITE_SERVER_URL=https://your-server.railway.app
```
Then build and deploy `client/dist/` to Vercel, Netlify, or GitHub Pages.

---

## Project structure

```
restaurant-picker/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useSocket.ts     # Socket.io hook + all shared types
│   │   ├── pages/
│   │   │   ├── LobbyPage.tsx    # Create / join room
│   │   │   └── RoomPage.tsx     # Preferences form + results
│   │   ├── App.tsx
│   │   └── index.css
│   └── vite.config.ts
└── server/               # Express + Socket.io backend
    └── src/
        ├── index.ts             # Server entry point & socket handlers
        ├── roomManager.ts       # In-memory room state
        └── placesApi.ts         # Google Places API integration
```
