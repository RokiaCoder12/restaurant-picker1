import { useSocket } from "./hooks/useSocket";
import LobbyPage from "./pages/LobbyPage";
import RoomPage from "./pages/RoomPage";

export default function App() {
  const { socketId, room, results, searching, error, connected, joinRoom, submitPreferences, resetRoom } =
    useSocket();

  if (!room) {
    return <LobbyPage onJoin={joinRoom} connected={connected} />;
  }

  return (
    <RoomPage
      room={room}
      mySocketId={socketId ?? ""}
      results={results}
      searching={searching}
      error={error}
      onSubmit={submitPreferences}
      onReset={resetRoom}
    />
  );
}
