// ...existing code...
import React from "react";

type GameInfoProps = {
  turn: string;
  gameOver: string | null;
  reason?: string;
  opponentConnected: boolean;
  playerColor?: string | null;
};

export function GameInfo({ turn, gameOver, reason, opponentConnected, playerColor }: GameInfoProps) {
  return (
    <div style={{ marginTop: 16, color: "#000" }}>
      <div style={{
        padding: 16, background: "#fff", borderRadius: 8,
        marginBottom: 16, border: "1px solid #e5e7eb", color: "#000"
      }}>
        <h3 style={{ marginTop: 0, color: "#000" }}>📊 Thông tin trận đấu</h3>

        <div style={{ marginBottom: 10, fontSize: 15, color: "#000" }}>
          <strong>Bạn:</strong>{" "}
          {playerColor === "white" ? "⚪ Trắng" : playerColor === "black" ? "⚫ Đen" : "Chưa nhận màu"}
        </div>

        <div style={{ marginBottom: 10, fontSize: 15, color: "#000" }}>
          <strong>Lượt đi:</strong> {turn === "white" ? "⚪ Trắng" : "⚫ Đen"}
        </div>

        <div style={{ marginBottom: 10, fontSize: 15, color: "#000" }}>
          <strong>Trạng thái:</strong>{" "}
          {gameOver
            ? <span style={{ color: "#000" }}>🏁 Kết thúc - {gameOver} {reason ? `(${reason})` : ""}</span>
            : <span style={{ color: "#000" }}>🎮 Đang chơi</span>}
        </div>

        <div style={{ fontSize: 15, color: "#000" }}>
          <strong>Đối thủ:</strong>{" "}
          {opponentConnected
            ? <span style={{ color: "#000" }}>✓ Đã sẵn sàng</span>
            : <span style={{ color: "#000" }}>⏳ Đang chờ...</span>}
        </div>
      </div>
    </div>
  );
}
// ...existing code...