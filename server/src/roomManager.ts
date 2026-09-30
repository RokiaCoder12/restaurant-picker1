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
  queries: { cuisine: string; priceRange: number; area: string }[];
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
    // Each user's preferences become their own search query
    const queries = room.users.map((u) => u.preferences!);
    return { queries };
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
