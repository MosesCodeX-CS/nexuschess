import { Chess, Move, Square } from 'chess.js'
import type { GameMove, PgnGame, PgnHeaders, ParsedMove, MoveValidation, GameState } from '../types/chess'

/**
 * Create a new chess game instance
 */
export function createChessGame(fen?: string): Chess {
  if (fen) {
    return new Chess(fen)
  }
  return new Chess()
}

/**
 * Get all legal moves in algebraic notation
 */
export function getLegalMoves(game: Chess): string[] {
  return game.moves({ verbose: false }) as string[]
}

/**
 * Get detailed legal move information
 */
export function getLegalMovesDetailed(game: Chess): Move[] {
  return game.moves({ verbose: true }) as Move[]
}

/**
 * Validate and make a move
 */
export function makeMove(game: Chess, move: string | { from: Square; to: Square; promotion?: string }): { success: boolean; move?: Move; error?: string } {
  try {
    const result = game.move(move)
    return { success: true, move: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Check if a move is valid
 */
export function isValidMove(game: Chess, from: Square, to: Square, promotion?: string): boolean {
  try {
    const tempGame = new Chess(game.fen())
    const move = promotion ? { from, to, promotion } : { from, to }
    tempGame.move(move)
    return true
  } catch {
    return false
  }
}

/**
 * Undo the last move
 */
export function undoMove(game: Chess): Move | null {
  try {
    return game.undo()
  } catch {
    return null
  }
}

/**
 * Reset the game to initial position
 */
export function resetGame(game: Chess): void {
  game.reset()
}

/**
 * Get the current FEN string
 */
export function getFen(game: Chess): string {
  return game.fen()
}

/**
 * Get the board as a 2D array
 */
export function getBoard(game: Chess) {
  return game.board()
}

/**
 * Check if the game is over
 */
export function isGameOver(game: Chess): boolean {
  return game.isGameOver()
}

/**
 * Get the game result
 */
export function getGameResult(game: Chess): string {
  if (game.isCheckmate()) return 'Checkmate'
  if (game.isDraw()) return 'Draw'
  if (game.isStalemate()) return 'Stalemate'
  if (game.isThreefoldRepetition()) return 'Threefold Repetition'
  if (game.isInsufficientMaterial()) return 'Insufficient Material'
  return 'Game in Progress'
}

/**
 * Get turn indicator
 */
export function getTurn(game: Chess): 'w' | 'b' {
  return game.turn() as 'w' | 'b'
}

/**
 * Parse PGN string into structured data
 */
export function parsePgn(pgn: string): PgnGame {
  const lines = pgn.split('\n')
  const headers: PgnHeaders = {}
  const moves: ParsedMove[] = []
  
  let currentLine = 0
  
  // Parse headers
  while (currentLine < lines.length) {
    const line = lines[currentLine].trim()
    if (line.startsWith('[') && line.endsWith(']')) {
      const match = line.match(/\[(\w+)\s+"([^"]*)"\]/)
      if (match) {
        headers[match[1] as keyof PgnHeaders] = match[2]
      }
      currentLine++
    } else {
      break
    }
  }
  
  // Parse moves
  const moveText = lines.slice(currentLine).join(' ').trim()
  const moveRegex = /(?:\{[^}]*\}|\([^)]*\)|\d+\.+|O-O(?:-O)?|[^0-9\s\{\}\(\)]+(?:\=[^ ]+)?|[\d-]+)/g
  const tokens = moveText.match(moveRegex) || []
  
  let moveNumber = 1
  let turn: 'w' | 'b' = 'w'
  let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const game = new Chess()
  
  for (const token of tokens) {
    // Skip comments and move numbers
    if (token.startsWith('{') || token.startsWith('(') || /^\d+\.$/.test(token)) {
      continue
    }
    
    const cleanToken = token.replace(/\{[^}]*\}/g, '').trim()
    if (!cleanToken || cleanToken === '1-0' || cleanToken === '0-1' || cleanToken === '1/2-1/2' || cleanToken === '*') {
      continue
    }
    
    try {
      game.move(cleanToken)
      fen = game.fen()
      
      moves.push({
        number: moveNumber,
        turn,
        san: cleanToken,
        fen,
      })
      
      if (turn === 'w') {
        turn = 'b'
      } else {
        turn = 'w'
        moveNumber++
      }
    } catch {
      // Invalid move, skip
    }
  }
  
  return { pgn, headers, moves }
}

/**
 * Generate PGN from game state
 */
export function generatePgn(
  headers: PgnHeaders,
  moves: { san: string; comment?: string }[]
): string {
  let pgn = ''
  
  // Add headers
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      pgn += `[${key} "${value}"]\n`
    }
  }
  pgn += '\n'
  
  // Add moves
  let moveNumber = 1
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    
    if (i % 2 === 0) {
      // White's move
      pgn += `${moveNumber}. ${move.san}`
    } else {
      // Black's move
      pgn += ` ${move.san} `
    }
    
    if (move.comment) {
      pgn += ` {${move.comment}}`
    }
    
    // Add newline every 8 moves for white
    if (i % 16 === 15) {
      pgn += '\n'
    }
  }
  
  return pgn.trim()
}

/**
 * Convert SAN to FEN-compatible move
 */
export function sanToMove(san: string, game: Chess): Move | null {
  try {
    return game.move(san)
  } catch {
    return null
  }
}

/**
 * Get piece at a specific square
 */
export function getPieceAt(game: Chess, square: string): { type: string; color: string } | null {
  const piece = game.get(square as Square)
  if (!piece) return null
  return {
    type: piece.type,
    color: piece.color,
  }
}

/**
 * Check if a square is under attack
 */
export function isSquareAttacked(game: Chess, square: string, byColor: 'w' | 'b'): boolean {
  return game.isAttacked(square as Square, byColor)
}

/**
 * Get all attacked squares by a color
 */
export function getAttackedSquares(game: Chess, byColor: 'w' | 'b'): string[] {
  const squares: string[] = []
  const board = game.board()
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = String.fromCharCode(97 + col) + (8 - row)
      if (game.isAttacked(square as Square, byColor)) {
        squares.push(square)
      }
    }
  }
  
  return squares
}

/**
 * Get move history in a structured format
 */
export function getMoveHistory(game: Chess): GameMove[] {
  const history = game.history({ verbose: true }) as unknown as Move[]
  return history.map(move => ({
    san: move.san,
    from: move.from,
    to: move.to,
    piece: move.piece,
    captured: move.captured,
    promotion: move.promotion,
    check: move.san.includes('+'),
    checkmate: move.san.includes('#'),
    castling: getCastlingType(move),
  }))
}

function getCastlingType(move: { san: string }): 'kingside' | 'queenside' | undefined {
  if (move.san === 'O-O') return 'kingside'
  if (move.san === 'O-O-O') return 'queenside'
  return undefined
}

/**
 * Navigate to a specific move number
 */
export function navigateToMove(game: Chess, moveNumber: number): void {
  const history = game.history({ verbose: true }) as unknown as Move[]
  game.reset()
  
  for (let i = 0; i < moveNumber && i < history.length; i++) {
    game.move(history[i])
  }
}

/**
 * Get castling rights
 */
function getCastlingRights(game: Chess): { whiteKingside: boolean; whiteQueenside: boolean; blackKingside: boolean; blackQueenside: boolean } {
  const board = game.board()
  const castling = { whiteKingside: true, whiteQueenside: true, blackKingside: true, blackQueenside: true }
  
  // Check if king or rook has moved
  // White side
  if (board[7][4]?.type !== 'k' || board[7][4]?.color !== 'w') {
    castling.whiteKingside = false
    castling.whiteQueenside = false
  }
  if (board[7][0]?.type !== 'r' || board[7][0]?.color !== 'w') {
    castling.whiteQueenside = false
  }
  if (board[7][7]?.type !== 'r' || board[7][7]?.color !== 'w') {
    castling.whiteKingside = false
  }
  
  // Black side
  if (board[0][4]?.type !== 'k' || board[0][4]?.color !== 'b') {
    castling.blackKingside = false
    castling.blackQueenside = false
  }
  if (board[0][0]?.type !== 'r' || board[0][0]?.color !== 'b') {
    castling.blackQueenside = false
  }
  if (board[0][7]?.type !== 'r' || board[0][7]?.color !== 'b') {
    castling.blackKingside = false
  }
  
  return castling
}

/**
 * Get game state snapshot
 */
export function getGameState(game: Chess): GameState {
  // Parse FEN to get en passant and halfmove/fullmove info
  const fenParts = game.fen().split(' ')
  
  return {
    fen: game.fen(),
    turn: game.turn() as 'w' | 'b',
    castling: getCastlingRights(game),
    enPassant: fenParts[3] !== '-' ? fenParts[3] : null,
    halfmoveClock: parseInt(fenParts[4]) || 0,
    fullmoveNumber: parseInt(fenParts[5]) || 1,
    history: getMoveHistory(game),
  }
}

/**
 * Create game from FEN
 */
export function createGameFromFen(fen: string): Chess {
  return new Chess(fen)
}

/**
 * Validate FEN string
 */
export function isValidFen(fen: string): boolean {
  try {
    new Chess(fen)
    return true
  } catch {
    return false
  }
}

/**
 * Get material count
 */
export function getMaterialCount(game: Chess): { white: number; black: number } {
  const board = game.board()
  const pieceValues: Record<string, number> = {
    p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
  }
  
  let white = 0
  let black = 0
  
  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        const value = pieceValues[piece.type] || 0
        if (piece.color === 'w') {
          white += value
        } else {
          black += value
        }
      }
    }
  }
  
  return { white, black }
}

