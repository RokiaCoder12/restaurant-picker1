import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface UserPrefs {
  cuisine: string;
  priceRange: number;
  area: string;
}

export interface RoomUser {
  socketId: string;
  name: string;
  preferences: UserPrefs | null;
}

export interface Room {
  code: string;
  users: RoomUser[];
}

export interface Restaurant {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel: number | null;
  types: string[];
  photoUrl: string | null;
  mapsUrl: string;
  score: number;
}

const SERVER_URL =
  typeof import.meta !== "undefined" &&
  (import.meta as { env?: Record<string, string> }).env?.VITE_SERVER_URL
    ? ((import.meta as { env?: Record<string, string> }).env!.VITE_SERVER_URL as string)
    : "http://localhost:3001";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setSocketId(socket.id ?? null);
    });
    socket.on("disconnect", () => {
      setConnected(false);
      setSocketId(null);
    });
    socket.on("room_update", (r: Room) => setRoom(r));
    socket.on("results", (r: Restaurant[]) => setResults(r));
    socket.on("searching", (v: boolean) => setSearching(v));
    socket.on("error", (msg: string) => setError(msg));

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomCode: string, userName: string) => {
    setError(null);
    setResults([]);
    socketRef.current?.emit("join_room", { roomCode: roomCode.toUpperCase(), userName });
  }, []);

  const submitPreferences = useCallback(
    (preferences: UserPrefs) => {
      if (!room) return;
      setError(null);
      socketRef.current?.emit("submit_preferences", { roomCode: room.code, preferences });
    },
    [room]
  );

  const resetRoom = useCallback(() => {
    if (!room) return;
    setResults([]);
    setError(null);
    socketRef.current?.emit("reset_room", { roomCode: room.code });
  }, [room]);

  return {
    socketId,
    room,
    results,
    searching,
    error,
    connected,
    joinRoom,
    submitPreferences,
    resetRoom,
  };
}
