import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./HomePage.css";

type HomePageProps = {
  onEnterRoom: (roomId: string) => void;
  onLogout: () => void;
};

export default function HomePage({ onEnterRoom, onLogout }: HomePageProps) {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState("");
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="home-page">
      {/* Header */}
      <header className="header">
        <div className="logo">♔ Chess Master</div>
        <div>
          <div className="username">{user?.username || "Người chơi"}</div>
          <div className="user-id">ID: {user?.user_id || "---"}</div>
        </div>
      </header>

      {/* Stats */}
      <section className="stats">
        {[
          { icon: "🏆", value: "24", label: "Chiến Thắng" },
          { icon: "🔥", value: "67%", label: "Tỷ Lệ Thắng" },
          { icon: "📈", value: "1650", label: "Xếp Hạng" },
        ].map((stat, i) => (
          <div
            key={i}
            className="stat-card"
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Game Modes */}
      <section className="modes">
        <h3 className="mode-title">CHẾ ĐỘ CHƠI</h3>
        <div className="mode-grid">
          {/* Mode 1: Private Room */}
          <div className="mode-card">
            <div className="mode-icon">👥</div>
            <h4 className="mode-title-text">Chơi Cùng Bạn</h4>
            <p className="mode-text">
              Ghép trận với bạn bè. Nhập mã phòng để chơi hoặc tạo phòng mới cho bạn bè tham gia.
            </p>
            <input
              type="text"
              placeholder="Nhập mã phòng"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.trim())}
              className="mode-input"
            />
            <button
              className="mode-btn mode-btn-primary"
              onClick={() => roomId && onEnterRoom(roomId)}
              disabled={!roomId}
            >
              Vào phòng
            </button>
          </div>

          {/* Mode 2: Random Match */}
          <div className="mode-card">
            <div className="mode-icon">⚡</div>
            <h4 className="mode-title-text">Ghép Trận Nhanh</h4>
            <p className="mode-text">Tìm đối thủ ngẫu nhiên có cùng trình độ.</p>
            <button
              className="mode-btn mode-btn-primary"
              onClick={() => onEnterRoom("auto")}
            >
              Tìm Ngay
            </button>
          </div>

          {/* Mode 3: Stats */}
          <div className="mode-card">
            <div className="mode-icon">📊</div>
            <h4 className="mode-title-text">Thống Kê</h4>
            <p className="mode-text">Xem thành tích và lịch sử đấu của bạn.</p>
            <button className="mode-btn mode-btn-green">Xem Chi Tiết</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <button className="logout-btn" onClick={onLogout}>
          Đăng Xuất
        </button>
      </footer>
    </div>
  );
}