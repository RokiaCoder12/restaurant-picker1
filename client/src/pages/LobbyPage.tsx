import { useState } from "react";

interface Props {
  onJoin: (roomCode: string, userName: string) => void;
  connected: boolean;
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function LobbyPage({ onJoin, connected }: Props) {
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userName.trim()) return;
    const code = mode === "create" ? generateRoomCode() : roomCode.trim().toUpperCase();
    if (!code) return;
    onJoin(code, userName.trim());
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ textAlign: "center" }}>
          <div className="logo">🍽️</div>
          <h1 className="app-title">Restaurant Picker</h1>
          <p className="app-subtitle">Find the perfect spot for your group</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your name</label>
            <input
              type="text"
              placeholder="e.g. Alice"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={30}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <button
              type="button"
              className={`price-btn ${mode === "create" ? "price-btn--active" : ""}`}
              onClick={() => setMode("create")}
            >
              Create room
            </button>
            <button
              type="button"
              className={`price-btn ${mode === "join" ? "price-btn--active" : ""}`}
              onClick={() => setMode("join")}
            >
              Join room
            </button>
          </div>

          {mode === "join" && (
            <div className="form-group">
              <label>Room code</label>
              <input
                type="text"
                placeholder="e.g. A3K7P"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={5}
                required
              />
            </div>
          )}

          <button
            className="btn btn--primary"
            type="submit"
            disabled={!connected || !userName.trim() || (mode === "join" && !roomCode.trim())}
          >
            {!connected ? "Connecting…" : mode === "create" ? "🚀 Create Room" : "🔗 Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
