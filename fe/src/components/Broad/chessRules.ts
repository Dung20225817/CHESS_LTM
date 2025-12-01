export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | '.';
export type Position = { row: number; col: number };
export type Move = { from: Position; to: Position };

export class ChessRules {
  // Kiểm tra quân cờ có phải của player không
  static isPlayerPiece(piece: string, playerColor: 'white' | 'black'): boolean {
    if (piece === '.') return false;
    const isWhite = piece === piece.toUpperCase();
    return playerColor === 'white' ? isWhite : !isWhite;
  }

  // Chuyển đổi từ notation (e2) sang position
  static notationToPosition(notation: string): Position | null {
    if (notation.length !== 2) return null;
    const col = notation.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(notation[1]);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return { row, col };
  }

  // Chuyển đổi từ position sang notation (e2)
  static positionToNotation(pos: Position): string {
    const file = String.fromCharCode('a'.charCodeAt(0) + pos.col);
    const rank = String(8 - pos.row);
    return `${file}${rank}`;
  }

  // Lấy quân cờ tại vị trí
  static getPieceAt(board: string[][], pos: Position): string {
    if (pos.row < 0 || pos.row > 7 || pos.col < 0 || pos.col > 7) return '';
    return board[pos.row][pos.col];
  }

  // Kiểm tra nước đi hợp lệ (cơ bản)
  static isValidMove(
    board: string[][],
    move: Move,
    playerColor: 'white' | 'black'
  ): { valid: boolean; error?: string } {
    const fromPiece = this.getPieceAt(board, move.from);
    const toPiece = this.getPieceAt(board, move.to);

    // Kiểm tra quân cờ nguồn
    if (!this.isPlayerPiece(fromPiece, playerColor)) {
      return { valid: false, error: 'Không phải quân cờ của bạn' };
    }

    // Không thể ăn quân cờ cùng màu
    if (toPiece !== '.' && this.isPlayerPiece(toPiece, playerColor)) {
      return { valid: false, error: 'Không thể ăn quân cờ của mình' };
    }

    // Kiểm tra theo từng loại quân
    const pieceType = fromPiece.toLowerCase();
    let isValid = false;

    switch (pieceType) {
      case 'p':
        isValid = this.isValidPawnMove(board, move, playerColor);
        break;
      case 'r':
        isValid = this.isValidRookMove(board, move);
        break;
      case 'n':
        isValid = this.isValidKnightMove(move);
        break;
      case 'b':
        isValid = this.isValidBishopMove(board, move);
        break;
      case 'q':
        isValid = this.isValidQueenMove(board, move);
        break;
      case 'k':
        isValid = this.isValidKingMove(move);
        break;
    }

    if (!isValid) {
      return { valid: false, error: 'Nước đi không hợp lệ' };
    }

    return { valid: true };
  }

  // Kiểm tra đường đi có bị chặn không
  static isPathClear(board: string[][], from: Position, to: Position): boolean {
    const rowDir = Math.sign(to.row - from.row);
    const colDir = Math.sign(to.col - from.col);
    
    let currentRow = from.row + rowDir;
    let currentCol = from.col + colDir;

    while (currentRow !== to.row || currentCol !== to.col) {
      if (board[currentRow][currentCol] !== '.') return false;
      currentRow += rowDir;
      currentCol += colDir;
    }

    return true;
  }

  // Tốt (Pawn)
  static isValidPawnMove(board: string[][], move: Move, playerColor: 'white' | 'black'): boolean {
    const direction = playerColor === 'white' ? -1 : 1;
    const startRow = playerColor === 'white' ? 6 : 1;
    const rowDiff = move.to.row - move.from.row;
    const colDiff = Math.abs(move.to.col - move.from.col);

    // Di chuyển thẳng
    if (colDiff === 0) {
      if (rowDiff === direction && board[move.to.row][move.to.col] === '.') {
        return true;
      }
      // Nước đầu tiên có thể đi 2 ô
      if (move.from.row === startRow && rowDiff === 2 * direction) {
        const middleRow = move.from.row + direction;
        return board[middleRow][move.from.col] === '.' && board[move.to.row][move.to.col] === '.';
      }
    }

    // Ăn chéo
    if (colDiff === 1 && rowDiff === direction) {
      return board[move.to.row][move.to.col] !== '.';
    }

    return false;
  }

  // Xe (Rook)
  static isValidRookMove(board: string[][], move: Move): boolean {
    const rowDiff = Math.abs(move.to.row - move.from.row);
    const colDiff = Math.abs(move.to.col - move.from.col);
    
    if ((rowDiff === 0 && colDiff > 0) || (colDiff === 0 && rowDiff > 0)) {
      return this.isPathClear(board, move.from, move.to);
    }
    return false;
  }

  // Mã (Knight)
  static isValidKnightMove(move: Move): boolean {
    const rowDiff = Math.abs(move.to.row - move.from.row);
    const colDiff = Math.abs(move.to.col - move.from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  // Tượng (Bishop)
  static isValidBishopMove(board: string[][], move: Move): boolean {
    const rowDiff = Math.abs(move.to.row - move.from.row);
    const colDiff = Math.abs(move.to.col - move.from.col);
    
    if (rowDiff === colDiff && rowDiff > 0) {
      return this.isPathClear(board, move.from, move.to);
    }
    return false;
  }

  // Hậu (Queen)
  static isValidQueenMove(board: string[][], move: Move): boolean {
    return this.isValidRookMove(board, move) || this.isValidBishopMove(board, move);
  }

  // Vua (King)
  static isValidKingMove(move: Move): boolean {
    const rowDiff = Math.abs(move.to.row - move.from.row);
    const colDiff = Math.abs(move.to.col - move.from.col);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff > 0 || colDiff > 0);
  }
}