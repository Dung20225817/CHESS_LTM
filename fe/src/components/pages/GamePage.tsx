import React from "react";
import { useAuth } from "../context/AuthContext";
import Board from "../Broad/Board";
import "./HomePage.css";

type GamePageProps = {
  roomId: string;
};

export default function GamePage({ roomId }: GamePageProps) {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <header className="chess-header" style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
      }}>
        <h1 style={{ margin: 0 }}>♔ Chess Master</h1>
        <div className="user-info" style={{ marginTop: 8 }}>
          <span style={{ fontSize: 16 }}>{user?.username || "Người chơi"}</span>
          <small style={{ marginLeft: 12, opacity: 0.8 }}>ID: {user?.user_id || "---"}</small>
        </div>
      </header>

      <main>
        <Board roomId={roomId} />
      </main>
    </div>
  );
}