export interface UserPreferences {
  cuisine: string;
  priceRange: number; // 1–4 matching Google's price_level
  area: string;
}

export interface RoomUser {
  socketId: string;
  name: string;
  preferences: UserPreferences | null;
}

export interface Room {
  code: string;
  users: RoomUser[];
}

export interface CombinedPreferences {
  cuisines: string[];
  priceRange: number; // average, rounded
  area: string; // majority vote or first non-empty
}

export class RoomManager {
  private rooms = new Map<string, Room>();
  // socket → room code lookup for fast disconnect handling
  private socketToRoom = new Map<string, string>();

  joinRoom(code: string, socketId: string, name: string): Room {
    let room = this.rooms.get(code);
    if (!room) {
      room = { code, users: [] };
      this.rooms.set(code, room);
    }
    // Remove any stale entry for this socket
    room.users = room.users.filter((u) => u.socketId !== socketId);
    room.users.push({ socketId, name, preferences: null });
    this.socketToRoom.set(socketId, code);
    return room;
  }

  submitPreferences(code: string, socketId: string, preferences: UserPreferences): Room | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    const user = room.users.find((u) => u.socketId === socketId);
    if (user) user.preferences = preferences;
    return room;
  }

  allSubmitted(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room || room.users.length === 0) return false;
    return room.users.every((u) => u.preferences !== null);
  }

  getCombinedPreferences(code: string): CombinedPreferences {
    const room = this.rooms.get(code)!;
    const prefs = room.users.map((u) => u.preferences!);

    const cuisines = [...new Set(prefs.map((p) => p.cuisine).filter(Boolean))];
    const avgPrice = Math.round(prefs.reduce((s, p) => s + p.priceRange, 0) / prefs.length);

    // Majority vote for area; fall back to first value
    const areaCounts = new Map<string, number>();
    for (const p of prefs) {
      if (p.area) areaCounts.set(p.area, (areaCounts.get(p.area) ?? 0) + 1);
    }
    const area =
      [...areaCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? prefs[0].area ?? "";

    return { cuisines, priceRange: avgPrice, area };
  }

  resetRoom(code: string): Room | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    room.users = room.users.map((u) => ({ ...u, preferences: null }));
    return room;
  }

  removeUser(socketId: string): string[] {
    const code = this.socketToRoom.get(socketId);
    this.socketToRoom.delete(socketId);
    if (!code) return [];

    const room = this.rooms.get(code);
    if (!room) return [];
    room.users = room.users.filter((u) => u.socketId !== socketId);
    if (room.users.length === 0) this.rooms.delete(code);
    return [code];
  }

  getRoom(code: string): Room | null {
    return this.rooms.get(code) ?? null;
  }
}
