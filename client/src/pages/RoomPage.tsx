import { useState } from "react";
import type { Room, Restaurant, UserPrefs } from "../hooks/useSocket";

const CUISINES = [
  "Any",
  "Italian",
  "Japanese",
  "Chinese",
  "Mexican",
  "Indian",
  "Thai",
  "Mediterranean",
  "American",
  "French",
  "Korean",
  "Vietnamese",
  "Greek",
  "Middle Eastern",
  "Seafood",
  "Steakhouse",
  "Vegetarian",
];

const PRICE_LABELS: Record<number, string> = {
  1: "$ Budget",
  2: "$$ Mid",
  3: "$$$ Upscale",
  4: "$$$$ Fine",
};

interface Props {
  room: Room;
  mySocketId: string;
  results: Restaurant[];
  searching: boolean;
  error: string | null;
  onSubmit: (prefs: UserPrefs) => void;
  onReset: () => void;
}

function starStr(rating: number) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function priceStr(level: number | null) {
  if (level === null) return "?";
  return "$".repeat(level);
}

export default function RoomPage({ room, mySocketId, results, searching, error, onSubmit, onReset }: Props) {
  const [cuisine, setCuisine] = useState("Any");
  const [priceRange, setPriceRange] = useState(2);
  const [area, setArea] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const me = room.users.find((u) => u.socketId === mySocketId);
  const iHaveSubmitted = me?.preferences != null || submitted;
  const waitingCount = room.users.filter((u) => u.preferences === null).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!area.trim()) return;
    setSubmitted(true);
    onSubmit({ cuisine: cuisine === "Any" ? "" : cuisine, priceRange, area: area.trim() });
  }

  // Reset local state when room resets
  const allReset = room.users.every((u) => u.preferences === null);
  if (allReset && submitted) setSubmitted(false);

  return (
    <div className="page">
      <div className={`card ${results.length > 0 ? "card--wide" : ""}`}>
        {/* Header */}
        <div className="room-header">
          <div>
            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Room</span>
          </div>
          <div className="room-code-badge">
            Code: <strong>{room.code}</strong>
          </div>
        </div>

        {/* Users */}
        <div className="users-grid">
          {room.users.map((u) => (
            <div
              key={u.socketId}
              className={`user-chip ${u.preferences ? "user-chip--done" : ""}`}
            >
              <div className="user-chip__name">
                {u.socketId === mySocketId ? `${u.name} (you)` : u.name}
              </div>
              <div className="user-chip__status">
                {u.preferences ? "✓ Ready" : "Choosing…"}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Results */}
        {results.length > 0 && (
          <>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.15rem" }}>
              🏆 Top restaurants for your group
            </h2>
            <div className="results-list">
              {results.map((r, i) => (
                <div key={r.placeId} className="restaurant-card">
                  <div className="restaurant-card__rank">#{i + 1}</div>
                  {r.photoUrl ? (
                    <img className="restaurant-card__photo" src={r.photoUrl} alt={r.name} />
                  ) : (
                    <div className="restaurant-card__photo--placeholder">🍴</div>
                  )}
                  <div className="restaurant-card__body">
                    <div className="restaurant-card__name">{r.name}</div>
                    <div className="restaurant-card__meta">{r.address}</div>
                    <div className="restaurant-card__tags">
                      {r.rating > 0 && (
                        <span className="tag tag--rating">
                          {starStr(r.rating)} {r.rating.toFixed(1)} ({r.userRatingsTotal.toLocaleString()})
                        </span>
                      )}
                      {r.priceLevel !== null && (
                        <span className="tag tag--price">{priceStr(r.priceLevel)}</span>
                      )}
                      {r.types.slice(0, 2).map((t) => (
                        <span key={t} className="tag">
                          {t.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                    <a className="maps-link" href={r.mapsUrl} target="_blank" rel="noreferrer">
                      View on Google Maps →
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn--secondary" onClick={onReset}>
              🔄 New round
            </button>
          </>
        )}

        {/* Searching */}
        {searching && (
          <div className="searching-banner">
            <div className="spinner" />
            Searching Google Maps for the best matches…
          </div>
        )}

        {/* Preference form */}
        {!iHaveSubmitted && results.length === 0 && !searching && (
          <>
            <hr className="divider" />
            <h2 style={{ marginBottom: "1rem", fontSize: "1.05rem" }}>
              Your preferences
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cuisine</label>
                <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                  {CUISINES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price range</label>
                <div className="price-btns">
                  {([1, 2, 3, 4] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`price-btn ${priceRange === p ? "price-btn--active" : ""}`}
                      onClick={() => setPriceRange(p)}
                    >
                      {PRICE_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Area / neighbourhood</label>
                <input
                  type="text"
                  placeholder="e.g. Manhattan, NYC or Soho, London"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn--primary" type="submit">
                ✓ Submit preferences
              </button>
            </form>
          </>
        )}

        {/* Waiting for others */}
        {iHaveSubmitted && results.length === 0 && !searching && (
          <div className="waiting-msg">
            ✓ Preferences submitted! Waiting for{" "}
            {waitingCount === 1 ? "1 other person" : `${waitingCount} others`}…
          </div>
        )}
      </div>
    </div>
  );
}
