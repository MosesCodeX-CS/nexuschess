import { Chess, Move, Square } from 'chess.js'

export interface GameMove {
  san: string
  from: string
  to: string
  piece: string
  captured?: string
  promotion?: string
  check?: boolean
  checkmate?: boolean
  castling?: 'kingside' | 'queenside'
}

export interface GameState {
  fen: string
  turn: 'w' | 'b'
  castling: {
    whiteKingside: boolean
    whiteQueenside: boolean
    blackKingside: boolean
    blackQueenside: boolean
  }
  enPassant: string | null
  halfmoveClock: number
  fullmoveNumber: number
  history: GameMove[]
  result?: GameResult
}

export type GameResult = 'white' | 'black' | 'draw' | '*'

export interface PgnGame {
  pgn: string
  headers: PgnHeaders
  moves: ParsedMove[]
}

export interface PgnHeaders {
  Event?: string
  Site?: string
  Date?: string
  Round?: string
  White?: string
  Black?: string
  Result?: string
  WhiteElo?: string
  BlackElo?: string
  TimeControl?: string
  ECO?: string
  Opening?: string
  Termination?: string
}

export interface ParsedMove {
  number: number
  turn: 'w' | 'b'
  san: string
  fen: string
  comment?: string
  variation?: ParsedMove[]
}

export interface MoveValidation {
  isValid: boolean
  legalMoves: string[]
  algebraicMoves: string[]
  captures?: boolean
  checks?: boolean
  castling?: boolean
  promotion?: boolean
  enPassant?: boolean
}

export interface BoardOrientation {
  color: 'white' | 'black'
  flipped: boolean
}

export interface GameSettings {
  orientation: 'white' | 'black'
  showCoordinates: boolean
  showLastMove: boolean
  showPossibleMoves: boolean
  animationSpeed: number
  clickToMove: boolean
  showMoveHints: boolean
  premoveEnabled: boolean
  moveHintsEnabled: boolean
  highlightLastMove: boolean
  highlightCheck: boolean
  highlightLegalMoves: boolean
  autoQueen: boolean
  confirmResign: boolean
  soundEnabled: boolean
  boardTheme: 'green' | 'blue' | 'brown'
  pieceSet: 'standard' | 'alpha' | 'california'
  moveMode: 'drag' | 'click' | 'both'
  autoPromoteToQueen: boolean
}

export interface Premove {
  from: string
  to: string
  color: 'w' | 'b'
  san: string
}

export interface MoveHint {
  square: string
  type: 'center-control' | 'tactical' | 'strategic'
  strength: number
}

export const INITIAL_GAME_STATE: GameState = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'w',
  castling: {
    whiteKingside: true,
    whiteQueenside: true,
    blackKingside: true,
    blackQueenside: true,
  },
  enPassant: null,
  halfmoveClock: 0,
  fullmoveNumber: 1,
  history: [],
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  orientation: 'white',
  showCoordinates: true,
  showLastMove: true,
  showPossibleMoves: true,
  animationSpeed: 200,
  clickToMove: true,
  showMoveHints: false,
  premoveEnabled: false,
  moveHintsEnabled: false,
  highlightLastMove: true,
  highlightCheck: true,
  highlightLegalMoves: true,
  autoQueen: true,
  confirmResign: false,
  soundEnabled: false,
  boardTheme: 'green',
  pieceSet: 'standard',
  moveMode: 'both',
  autoPromoteToQueen: true,
}

