import React, { useState, useMemo, useEffect, useCallback } from "react";
import { BoardGrid } from "./BoardGrid";
import { GameInfo } from "./GameInfo";
import { ConnectionStatus } from "./ConnectionStatus";
import useChessSocket from "../context/useChessSocket";
import { ChessRules } from "./chessRules";

type BoardProps = { roomId: string };

export default function Board({ roomId }: BoardProps) {
  const [fen, setFen] = useState<string>("................................................................");
  const [turn, setTurn] = useState<string>("white");
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<'waiting' | 'ready' | 'playing' | 'finished'>('waiting');
  const [opponentConnected, setOpponentConnected] = useState<boolean>(false);

  const onUpdate = useCallback((newFen: string, newTurn: string, over: string | null, r?: string) => {
    if (newFen) setFen(newFen);
    setTurn(newTurn);
    setGameOver(over);
    setReason(r);
    setSelectedFrom(null);
    setValidMoves([]);
    setGameStatus(over ? 'finished' : (newFen && newFen !== "................................................................" ? 'playing' : 'waiting'));
  }, []);

  const { connected, playerColor, sendMove } = useChessSocket(roomId, onUpdate);

  useEffect(() => {
    if (connected && playerColor) {
      setGameStatus('ready');
    } else {
      setGameStatus('waiting');
    }
  }, [connected, playerColor]);

  useEffect(() => {
    if (gameStatus === 'playing') setOpponentConnected(true);
  }, [gameStatus]);

  const board = useMemo(() => {
    const parts = fen && fen.includes("/") ? fen.split("/") : [];
    let rows: string[][] = [];
    if (parts.length === 8) rows = parts.map(row => row.split(""));
    else if (fen.length >= 64)
      for (let i = 0; i < 8; i++) rows.push(fen.slice(i * 8, i * 8 + 8).split(""));
    else rows = Array.from({ length: 8 }, () => Array(8).fill("."));
    return rows;
  }, [fen]);

  function idxToSquare(r: number, c: number): string {
    const file = String.fromCharCode("a".charCodeAt(0) + c);
    const rank = String(8 - r);
    return `${file}${rank}`;
  }

  function handleSquareClick(r: number, c: number) {
    const sq = idxToSquare(r, c);

    if (gameStatus === 'waiting') return setErrorMsg("⏳ Đang chờ kết nối...");
    if (gameStatus === 'ready' && !opponentConnected) return setErrorMsg("⏳ Đang chờ đối thủ tham gia...");
    if (gameOver) return setErrorMsg("🏁 Trận đấu đã kết thúc!");
    if (playerColor !== turn) return setErrorMsg("⏱️ Chưa đến lượt của bạn!");

    if (!selectedFrom) {
      const piece = board[r][c];
      if (!ChessRules.isPlayerPiece(piece, playerColor as 'white' | 'black')) {
        return setErrorMsg("❌ Hãy chọn quân cờ của bạn!");
      }

      setSelectedFrom(sq);
      setErrorMsg("");
      const possible: string[] = [];
      for (let toR = 0; toR < 8; toR++) {
        for (let toC = 0; toC < 8; toC++) {
          const toSq = idxToSquare(toR, toC);
          const fromPos = ChessRules.notationToPosition(sq);
          const toPos = ChessRules.notationToPosition(toSq);
          if (fromPos && toPos) {
            const validation = ChessRules.isValidMove(board, { from: fromPos, to: toPos }, playerColor as 'white' | 'black');
            if (validation.valid) possible.push(toSq);
          }
        }
      }
      setValidMoves(possible);
      return;
    }

    if (selectedFrom === sq) {
      setSelectedFrom(null);
      setValidMoves([]);
      return;
    }

    const fromPos = ChessRules.notationToPosition(selectedFrom);
    const toPos = ChessRules.notationToPosition(sq);
    if (!fromPos || !toPos) return setErrorMsg("❌ Vị trí không hợp lệ!");

    const validation = ChessRules.isValidMove(board, { from: fromPos, to: toPos }, playerColor as 'white' | 'black');
    if (!validation.valid) {
      setErrorMsg(validation.error || "❌ Nước đi không hợp lệ!");
      setSelectedFrom(null);
      setValidMoves([]);
      return;
    }

    const ok = sendMove(`${selectedFrom}${sq}`);
    if (!ok) setErrorMsg("⚠️ Không thể gửi nước đi!");
    setSelectedFrom(null);
    setValidMoves([]);
    setErrorMsg("");
  }

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
      maxWidth: 1400, 
      margin: "0 auto", 
      padding: 24,
      //background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: 16, 
        padding: 24,
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ marginBottom: 20 }}>
          <ConnectionStatus 
            gameStatus={gameStatus} 
            playerColor={playerColor} 
            roomId={roomId} 
            connected={connected} 
            opponentConnected={opponentConnected} 
          />
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Board */}
          <div style={{ flex: "0 0 auto" }}>
            <BoardGrid
              board={board}
              selectedFrom={selectedFrom}
              validMoves={validMoves}
              handleSquareClick={handleSquareClick}
              gameOver={!!gameOver}
            />
          </div>

          {/* Info sidebar */}
          <div style={{ flex: "1 1 360px", maxWidth: 400 }}>
            <GameInfo 
              turn={turn} 
              gameOver={gameOver} 
              reason={reason} 
              opponentConnected={opponentConnected} 
              playerColor={playerColor} 
            />

            {/* Status & Controls */}
            <div style={{ 
              marginTop: 16, 
              padding: 16, 
              background: "#f9fafb", 
              borderRadius: 12, 
              border: "2px solid #e5e7eb"
            }}>
              {errorMsg ? (
                <div style={{ 
                  color: "#dc2626", 
                  marginBottom: 12,
                  padding: 12,
                  background: '#fee2e2',
                  borderRadius: 8,
                  fontWeight: 500
                }}>
                  {errorMsg}
                </div>
              ) : (
                <div style={{ 
                  color: "#059669", 
                  marginBottom: 12,
                  padding: 12,
                  background: '#d1fae5',
                  borderRadius: 8,
                  fontWeight: 500
                }}>
                  ✓ Sẵn sàng
                </div>
              )}

              <div style={{ 
                display: "flex", 
                gap: 12, 
                alignItems: 'center',
                padding: 12,
                background: 'white',
                borderRadius: 8,
                marginBottom: 12
              }}>
                <div style={{ flex: 1 }}>
                  {connected ? (
                    <span style={{ color: "#10b981", fontWeight: 600 }}>● Đã kết nối</span>
                  ) : (
                    <span style={{ color: "#f59e0b", fontWeight: 600 }}>● Đang kết nối...</span>
                  )}
                  <div style={{ marginTop: 6, fontSize: 14, color: '#6b7280' }}>
                    Bạn: {playerColor === "white" ? "⚪ Trắng" : playerColor === "black" ? "⚫ Đen" : "—"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { window.location.href = '/'; }}
                style={{
                  width: '100%',
                  padding: "12px 16px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                }}
              >
                🚪 Rời phòng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}