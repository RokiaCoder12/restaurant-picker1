import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { RoomManager } from "./roomManager.ts";
import { fetchRestaurants } from "./placesApi.ts";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

io.on("connection", (socket) => {
  console.error(`[socket] connected: ${socket.id}`);

  // Create or join a room
  socket.on("join_room", ({ roomCode, userName }: { roomCode: string; userName: string }) => {
    const room = roomManager.joinRoom(roomCode, socket.id, userName);
    socket.join(roomCode);
    io.to(roomCode).emit("room_update", room);
    console.error(`[room] ${userName} joined room ${roomCode}`);
  });

  // User submits preferences
  socket.on(
    "submit_preferences",
    async ({
      roomCode,
      preferences,
    }: {
      roomCode: string;
      preferences: { cuisine: string; priceRange: number; area: string };
    }) => {
      const room = roomManager.submitPreferences(roomCode, socket.id, preferences);
      if (!room) return;

      io.to(roomCode).emit("room_update", room);

      // All users have submitted — fetch restaurants
      if (roomManager.allSubmitted(roomCode)) {
        io.to(roomCode).emit("searching", true);
        try {
          const combined = roomManager.getCombinedPreferences(roomCode);
          const restaurants = await fetchRestaurants(combined);
          io.to(roomCode).emit("results", restaurants);
        } catch (err) {
          io.to(roomCode).emit("error", "Failed to fetch restaurants. Check your API key.");
          console.error("[places] error:", err);
        } finally {
          io.to(roomCode).emit("searching", false);
        }
      }
    }
  );

  // User wants to reset the room for a new round
  socket.on("reset_room", ({ roomCode }: { roomCode: string }) => {
    const room = roomManager.resetRoom(roomCode);
    if (room) io.to(roomCode).emit("room_update", room);
  });

  socket.on("disconnect", () => {
    const affected = roomManager.removeUser(socket.id);
    for (const roomCode of affected) {
      const room = roomManager.getRoom(roomCode);
      if (room) {
        io.to(roomCode).emit("room_update", room);
      }
    }
    console.error(`[socket] disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.error(`[server] listening on http://localhost:${PORT}`);
});
