import React from "react";

type ConnectionStatusProps = {
  gameStatus: 'waiting' | 'ready' | 'playing' | 'finished';
  playerColor?: string | null; // cho phép null
  roomId: string;
  connected: boolean;
  opponentConnected: boolean;
};


export function ConnectionStatus({ gameStatus, playerColor, roomId, connected, opponentConnected }: ConnectionStatusProps) {
  if (gameStatus === 'waiting') {
    return (
      <div style={{
        padding: 20, background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        color: "#1a1a1a", borderRadius: 12, textAlign: "center", marginBottom: 16,
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)", border: "2px solid #90caf9"
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⏳</div>
        <h3 style={{ margin: "8px 0", color: "#1565c0" }}>Đang kết nối với phòng...</h3>
        <p style={{ margin: 0, color: "#424242" }}>Room ID: {roomId}</p>
      </div>
    );
  }

  if (gameStatus === 'ready' && !opponentConnected) {
    return (
      <div style={{
        padding: 20, background: "linear-gradient(135deg, #fff9c4 0%, #ffeb3b 100%)",
        color: "#1a1a1a", borderRadius: 12, textAlign: "center", marginBottom: 16,
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)", animation: "pulse 2s ease-in-out infinite",
        border: "2px solid #fbc02d"
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
        <h3 style={{ margin: "8px 0", color: "#f57f17" }}>Đang chờ đối thủ...</h3>
        <p style={{ margin: "8px 0", color: "#424242" }}>
          Bạn đang chơi quân: {playerColor === "white" ? "⚪ Trắng" : "⚫ Đen"}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "#616161" }}>
          Chia sẻ Room ID <strong style={{ color: "#d84315" }}>{roomId}</strong> cho đối thủ
        </p>
      </div>
    );
  }

  return null;
}
