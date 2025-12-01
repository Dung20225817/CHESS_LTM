import { useEffect, useRef, useState, useCallback } from "react";

type UpdateCallback = (fen: string, turn: string, gameOver: string | null, reason?: string) => void;

function makeWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const envHost = process.env.REACT_APP_WS_HOST;
  const host = envHost || `${window.location.hostname}:8765`;
  return `${proto}//${host}`;
}

export default function useChessSocket(roomId: string, onUpdate: UpdateCallback) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parseAndDispatch = useCallback((raw: string) => {
    console.log('📥 Received from server:', raw);
    
    // Hỗ trợ nhiều JSON objects
    const matches = raw.match(/{[^}]+}/g);
    if (!matches) {
      console.warn('⚠️ No JSON found in message:', raw);
      return;
    }

    for (const jsonStr of matches) {
      try {
        const data = JSON.parse(jsonStr);
        console.log('📦 Parsed message:', data);
        
        if (!data || !data.type) {
          console.warn('⚠️ Message missing type:', data);
          continue;
        }

        switch (data.type) {
          // Server gán màu quân cho người chơi
          case "joined":
          case "assignColor":
            if (data.color === "white" || data.color === "black") {
              console.log('🎨 Player color assigned:', data.color);
              setPlayerColor(data.color);
              
              // Nếu có FEN kèm theo (bàn cờ khởi tạo)
              if (data.fen) {
                onUpdate(data.fen, data.turn || "white", null);
              }
            }
            break;

          // Cập nhật trạng thái bàn cờ
          case "state":
          case "update":
            console.log('♟️ Board update:', { fen: data.fen, turn: data.turn });
            onUpdate(
              data.fen || "", 
              data.turn || "white", 
              null, 
              undefined
            );
            break;

          // Game kết thúc
          case "gameOver":
            console.log('🏁 Game over:', { winner: data.winner, reason: data.reason });
            onUpdate(
              data.fen || "",
              data.turn || "white",
              data.winner || null,
              data.reason
            );
            break;

          // Nước đi đã được xử lý
          case "move":
            console.log('👟 Move processed:', { fen: data.fen, turn: data.turn });
            if (data.fen) {
              onUpdate(
                data.fen,
                data.turn || "white",
                data.gameOver || null,
                data.reason
              );
            }
            break;

          // Lỗi từ server
          case "error":
            console.error('❌ Server error:', data.msg);
            // Có thể hiển thị toast/notification cho user
            break;

          default:
            console.debug('❓ Unknown message type:', data.type, data);
        }
      } catch (err) {
        console.error('💥 JSON parse error:', jsonStr, err);
      }
    }
  }, [onUpdate]);

  useEffect(() => {
    // Nếu không có roomId, ngắt kết nối
    if (!roomId) {
      console.log('🚫 No room ID, disconnecting...');
      if (wsRef.current) {
        try { 
          wsRef.current.close(); 
        } catch {}
        wsRef.current = null;
      }
      setConnected(false);
      setPlayerColor(null);
      return;
    }

    console.log('🔌 Connecting to room:', roomId);
    const url = makeWsUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const cleanup = () => {
      console.log('🧹 Cleaning up WebSocket');
      try { ws.close(); } catch {}
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      setConnected(false);
    };

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      
      // Gửi JOIN ngay khi kết nối
      try {
        const joinMsg = JSON.stringify({ type: "join", room: roomId });
        console.log('📤 Sending JOIN:', joinMsg);
        ws.send(joinMsg);
      } catch (e) {
        console.error('❌ Failed to send JOIN:', e);
      }
    };

    ws.onmessage = (ev) => {
      const data = typeof ev.data === "string" ? ev.data : "";
      parseAndDispatch(data);
    };

    ws.onerror = (ev) => {
      console.error('❌ WebSocket error:', ev);
    };

    ws.onclose = (ev) => {
      console.log('🔌 WebSocket closed:', ev.code, ev.reason);
      cleanup();
      
      // Auto-reconnect sau 3 giây (nếu vẫn còn roomId)
      if (roomId) {
        console.log('🔄 Will attempt reconnect in 3s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting reconnect...');
          // Component sẽ tự reconnect vì useEffect chạy lại
        }, 3000);
      }
    };

    // Cleanup khi unmount hoặc roomId thay đổi
    return () => {
      console.log('🔚 useChessSocket cleanup');
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      try { ws.close(); } catch {}
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [roomId, parseAndDispatch]);

  const sendMove = useCallback((move: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send move: WebSocket not open');
      return false;
    }
    
    try {
      const moveMsg = JSON.stringify({ type: "move", move });
      console.log('📤 Sending move:', moveMsg);
      ws.send(moveMsg);
      return true;
    } catch (e) {
      console.error('❌ Failed to send move:', e);
      return false;
    }
  }, []);

  const sendChat = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send chat: WebSocket not open');
      return false;
    }
    
    try {
      const chatMsg = JSON.stringify({ type: "chat", text });
      console.log('📤 Sending chat:', chatMsg);
      ws.send(chatMsg);
      return true;
    } catch (e) {
      console.error('❌ Failed to send chat:', e);
      return false;
    }
  }, []);

  const leaveRoom = useCallback(() => {
    console.log('🚪 Leaving room');
    const ws = wsRef.current;
    
    if (ws) {
      try { 
        ws.send(JSON.stringify({ type: "leave", room: roomId })); 
      } catch (e) {
        console.error('❌ Failed to send leave message:', e);
      }
      
      try { 
        ws.close(); 
      } catch {}
      
      wsRef.current = null;
    }
    
    setConnected(false);
    setPlayerColor(null);
  }, [roomId]);

  return {
    connected,
    playerColor,
    sendMove,
    sendChat,
    leaveRoom,
  };
}