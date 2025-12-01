import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  username: string;
  user_id: string;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string, timeoutMs?: number) => Promise<boolean>;
  register: (username: string, password: string, timeoutMs?: number) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "chess_user";

function makeWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const envHost = process.env.REACT_APP_WS_HOST;
  const host = envHost || `${window.location.hostname}:8765`;
  return `${proto}//${host}`;
}

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);

  // Load user từ localStorage khi mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const savedUser = JSON.parse(raw);
        console.log('👤 Loaded user from storage:', savedUser);
        setUserState(savedUser);
      }
    } catch (e) {
      console.error('❌ Failed to load user from storage:', e);
    }
  }, []);

  const persistUser = (u: User | null) => {
    setUserState(u);
    try {
      if (u) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        console.log('💾 Saved user to storage:', u);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Removed user from storage');
      }
    } catch (e) {
      console.error('❌ Failed to persist user:', e);
    }
  };

  const doAuth = (
    type: "LOGIN" | "REGISTER", 
    username: string, 
    password: string, 
    timeoutMs = 10000
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log(`🔐 Starting ${type} for user:`, username);
      
      const url = makeWsUrl();
      let settled = false;
      const ws = new WebSocket(url);

      const cleanup = () => {
        try { 
          ws.close(); 
        } catch {}
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
      };

      const finish = (ok: boolean, u?: User) => {
        if (settled) return;
        settled = true;
        
        console.log(`${ok ? '✅' : '❌'} ${type} ${ok ? 'succeeded' : 'failed'}`);
        
        if (u) persistUser(u);
        cleanup();
        resolve(ok);
      };

      const timer = window.setTimeout(() => {
        console.warn(`⏱️ ${type} timeout after ${timeoutMs}ms`);
        finish(false);
      }, timeoutMs);

      ws.onopen = () => {
        console.log('🔌 Auth WebSocket connected');
        try {
          const authMsg = JSON.stringify({ type, username, password });
          console.log('📤 Sending auth request:', { type, username });
          ws.send(authMsg);
        } catch (e) {
          console.error('❌ Failed to send auth request:', e);
          finish(false);
          clearTimeout(timer);
        }
      };

      ws.onmessage = (ev) => {
        console.log('📥 Auth response received:', ev.data);
        
        try {
          const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
          
          // Kiểm tra response type khớp với request
          if (data && data.type === type) {
            if (data.success) {
              const u: User = { 
                username, 
                user_id: data.user_id || "" 
              };
              console.log('✅ Auth successful, user:', u);
              finish(true, u);
            } else {
              console.warn('❌ Auth failed:', data.msg || 'Unknown error');
              finish(false);
            }
            clearTimeout(timer);
            return;
          }
          
          // Xử lý error response
          if (data && data.type === "error") {
            console.error('❌ Server error:', data.msg);
            finish(false);
            clearTimeout(timer);
            return;
          }
          
          console.warn('⚠️ Unexpected response type:', data?.type);
        } catch (e) {
          console.error('💥 Failed to parse auth response:', e);
          // Không finish ngay, chờ timeout hoặc message đúng
        }
      };

      ws.onerror = (ev) => {
        console.error('❌ Auth WebSocket error:', ev);
        finish(false);
        clearTimeout(timer);
      };

      ws.onclose = (ev) => {
        console.log('🔌 Auth WebSocket closed:', ev.code, ev.reason);
        // Nếu chưa settled, coi như failed
        if (!settled) {
          console.warn('⚠️ WebSocket closed before auth completed');
          finish(false);
        }
        clearTimeout(timer);
      };
    });
  };

  const login = (username: string, password: string, timeoutMs?: number) => {
    return doAuth("LOGIN", username, password, timeoutMs);
  };

  const register = (username: string, password: string, timeoutMs?: number) => {
    return doAuth("REGISTER", username, password, timeoutMs);
  };

  const logout = () => {
    console.log('👋 Logging out');
    persistUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
