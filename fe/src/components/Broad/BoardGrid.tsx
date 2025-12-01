import React from "react";

const pieceToEmoji: Record<string, string> = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟︎",
  ".": "",
};

// Màu sắc cho quân cờ
const getPieceColor = (piece: string): string => {
  if (piece === '.') return '#999';
  // Quân trắng (chữ hoa)
  if (piece === piece.toUpperCase()) return '#ffffff';
  // Quân đen (chữ thường)
  return '#000000';
};

// Shadow cho quân cờ để nổi bật
const getPieceShadow = (piece: string): string => {
  if (piece === '.') return 'none';
  if (piece === piece.toUpperCase()) {
    // Quân trắng - shadow đen
    return '0 2px 4px rgba(0,0,0,0.3), 0 0 2px rgba(0,0,0,0.5)';
  }
  // Quân đen - shadow trắng để nổi bật
  return '0 2px 4px rgba(255,255,255,0.3), 0 0 2px rgba(255,255,255,0.5)';
};

type BoardGridProps = {
  board: string[][];
  selectedFrom: string | null;
  validMoves: string[];
  handleSquareClick: (r: number, c: number) => void;
  gameOver: boolean;
};

export function BoardGrid({ board, selectedFrom, validMoves, handleSquareClick, gameOver }: BoardGridProps) {
  function idxToSquare(r: number, c: number): string {
    const file = String.fromCharCode("a".charCodeAt(0) + c);
    const rank = String(8 - r);
    return `${file}${rank}`;
  }

  return (
    <div style={{
      position: 'relative',
      width: 'fit-content',
      margin: '0 auto'
    }}>
      {/* Board coordinates - Files (a-h) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0 8px',
        marginBottom: 4,
        color: '#4a4a4a',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '0.5px'
      }}>
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
          <div key={file} style={{ width: 64, textAlign: 'center' }}>{file}</div>
        ))}
      </div>

      <div style={{ display: 'flex' }}>
        {/* Ranks (8-1) on the left */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          paddingRight: 4,
          color: '#4a4a4a',
          fontSize: 14,
          fontWeight: 600
        }}>
          {['8', '7', '6', '5', '4', '3', '2', '1'].map(rank => (
            <div key={rank} style={{ height: 64, display: 'flex', alignItems: 'center' }}>{rank}</div>
          ))}
        </div>

        {/* Chess Board */}
        <div style={{
          border: '6px solid #8b4513',
          borderRadius: 8,
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 64px)',
          gridTemplateRows: 'repeat(8, 64px)',
          userSelect: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
          padding: 4,
          overflow: 'hidden'
        }}>
          {board.map((row, r) =>
            row.map((piece, c) => {
              const sq = idxToSquare(r, c);
              const isSelected = selectedFrom === sq;
              const isValidMove = validMoves.includes(sq);
              
              // Màu ô cờ
              const lightSquare = '#f0d9b5';
              const darkSquare = '#b58863';
              const bg = (r + c) % 2 === 0 ? lightSquare : darkSquare;
              
              let bgColor = bg;
              if (isSelected) {
                bgColor = '#7fc97f'; // Xanh lá khi chọn
              } else if (isValidMove) {
                bgColor = '#fdc689'; // Vàng cam cho nước đi hợp lệ
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  style={{
                    width: 64,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: bgColor,
                    fontSize: 42,
                    fontWeight: 'bold',
                    cursor: gameOver ? 'not-allowed' : 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: isValidMove ? '3px solid #f97316' : 'none',
                    position: 'relative',
                    color: getPieceColor(piece),
                    textShadow: getPieceShadow(piece),
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isSelected ? 'inset 0 0 20px rgba(127, 201, 127, 0.5)' : 'none'
                  }}
                  title={sq}
                  onMouseEnter={(e) => {
                    if (!gameOver && piece !== '.') {
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.filter = 'brightness(1.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'brightness(1)';
                    }
                  }}
                >
                  {pieceToEmoji[piece] ?? piece}
                  
                  {/* Hint dot cho ô trống có thể di chuyển */}
                  {isValidMove && piece === '.' && (
                    <div style={{
                      position: 'absolute',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.25)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  )}
                  
                  {/* Ring cho ô có quân có thể ăn */}
                  {isValidMove && piece !== '.' && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      border: '4px solid rgba(239, 68, 68, 0.6)',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite'
                    }} />
                  )}
                  
                  {/* Coordinate label cho ô a1 và h8 */}
                  {((r === 7 && c === 0) || (r === 0 && c === 7)) && (
                    <div style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      fontSize: 9,
                      color: (r + c) % 2 === 0 ? darkSquare : lightSquare,
                      opacity: 0.5,
                      fontWeight: 'bold'
                    }}>
                      {sq}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Ranks (8-1) on the right */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          paddingLeft: 4,
          color: '#4a4a4a',
          fontSize: 14,
          fontWeight: 600
        }}>
          {['8', '7', '6', '5', '4', '3', '2', '1'].map(rank => (
            <div key={rank} style={{ height: 64, display: 'flex', alignItems: 'center' }}>{rank}</div>
          ))}
        </div>
      </div>

      {/* Board coordinates - Files (a-h) bottom */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0 8px',
        marginTop: 4,
        color: '#4a4a4a',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '0.5px'
      }}>
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
          <div key={file} style={{ width: 64, textAlign: 'center' }}>{file}</div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 16,
        textAlign: 'center',
        fontSize: 12,
        color: '#747272ff',
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: '#7fc97f', border: '1px solid #4a4a4a', borderRadius: 3 }} />
          <span>Ô đã chọn</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: '#fdc689', border: '1px solid #4a4a4a', borderRadius: 3 }} />
          <span>Nước đi hợp lệ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: '#fff', border: '1px solid #4a4a4a', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>♔</div>
          <span>Quân trắng</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 20, background: '#f0d9b5', border: '1px solid #4a4a4a', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#000', textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>♚</div>
          <span>Quân đen</span>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}