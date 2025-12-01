// ...existing code...
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./HomePage.css";

export default function RegisterPage({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!username.trim() || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      // register có hỗ trợ timeoutMs thứ 3
      const ok = await register(username.trim(), password, 10000);
      if (!ok) {
        setError("Đăng ký thất bại — tên đã tồn tại hoặc lỗi server.");
      }
      // nếu ok thì AuthContext đã lưu user -> App sẽ chuyển trang
    } catch (e) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <header className="header">
        <div className="logo">♔ Chess Master</div>
      </header>

      <div className="mode-card" style={{ maxWidth: 420, margin: "24px auto" }}>
        <h2 className="mode-title-text" style={{ marginBottom: 12 }}>Tạo tài khoản mới</h2>

        {error && <div style={{ marginBottom: 12, color: "#fecaca", background: "#7f1d1d", padding: 8, borderRadius: 6 }}>{error}</div>}

        <input
          className="mode-input"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <input
          className="mode-input"
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <button
          className="mode-btn mode-btn-primary"
          onClick={handleRegister}
          disabled={loading || !username.trim() || !password}
          style={{ marginTop: 12 }}
        >
          {loading ? "Đang tạo..." : "Tạo tài khoản"}
        </button>

        <div style={{ marginTop: 12, textAlign: "center", color: "#9ca3af" }}>
          Đã có tài khoản?{" "}
          <button onClick={onSwitchToLogin} style={{ color: "#facc15", background: "none", border: "none", cursor: "pointer" }}>
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
// ...existing code...