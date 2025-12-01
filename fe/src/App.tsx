// ...existing code...
import { useState, useEffect } from "react";
import { useAuth } from "./components/context/AuthContext";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import HomePage from "./components/pages/HomePage";
import GamePage from "./components/pages/GamePage";

function App() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState<"login" | "register" | "home" | "game">("login");
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    // Khi đã có user thì chuyển về trang home
    if (user) {
      setPage("home");
    }
  }, [user]);

  // Nếu chưa đăng nhập
  if (!user) {
    if (page === "login") {
      return <LoginPage onSwitchToRegister={() => setPage("register")} />;
    }
    return <RegisterPage onSwitchToLogin={() => setPage("login")} />;
  }

  // Sau khi đăng nhập
  if (page === "home") {
    return (
      <HomePage
        onEnterRoom={(id) => {
          setRoomId(id);
          setPage("game");
        }}
        onLogout={() => {
          logout();
          setPage("login");
        }}
      />
    );
  }

  if (page === "game") {
    return <GamePage roomId={roomId} />;
  }

  return null;
}

export default App;
// ...existing code...