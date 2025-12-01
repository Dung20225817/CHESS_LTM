// ...existing code...
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./HomePage.css";

export default function LoginPage({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    const u = username.trim();
    if (!u || !password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const ok = await login(u, password, 10000);
      if (!ok) {
        setError("Đăng nhập thất bại. Kiểm tra thông tin hoặc thử lại.");
      }
      // nếu ok thì AuthContext lưu user -> App sẽ chuyển trang
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="home-page">
      <header className="header">
        <div className="logo">♔ Chess Master</div>
      </header>

      <div className="mode-card" style={{ maxWidth: 420, margin: "28px auto" }}>
        <h2 className="mode-title-text" style={{ marginBottom: 12 }}>Đăng nhập</h2>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              marginBottom: 12,
              color: "#b91c1c",
              background: "#fee2e2",
              padding: 8,
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <input
          className="mode-input"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoFocus
          autoComplete="username"
        />

        <input
          className="mode-input"
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          autoComplete="current-password"
        />

        <button
          className="mode-btn mode-btn-primary"
          onClick={handleLogin}
          disabled={loading || !username.trim() || !password}
          style={{ marginTop: 12 }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div style={{ marginTop: 12, textAlign: "center", color: "#9ca3af" }}>
          Chưa có tài khoản?{" "}
          <button
            onClick={onSwitchToRegister}
            disabled={loading}
            style={{ color: "#facc15", background: "none", border: "none", cursor: "pointer" }}
          >
            Đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}
// ...existing code...