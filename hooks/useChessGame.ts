import { create } from 'zustand'
import { Chess } from 'chess.js'
import type { GameSettings, GameMove } from '@/lib/chess/types/chess'

interface ChessGameState {
  // Game state
  game: Chess
  fen: string
  turn: 'w' | 'b'
  isGameOver: boolean
  gameResult: string
  
  // Move history
  moveHistory: GameMove[]
  currentMoveIndex: number
  
  // Settings
  settings: GameSettings
  
  // Actions
  makeMove: (move: string | { from: string; to: string; promotion?: string }) => boolean
  undoMove: () => void
  resetGame: () => void
  goToMove: (index: number) => void
  goToStart: () => void
  goToEnd: () => void
  goForward: () => void
  goBack: () => void
  
  // Settings actions
  setOrientation: (orientation: 'white' | 'black') => void
  toggleCoordinates: () => void
  setAnimationSpeed: (speed: number) => void
  
  // Import/Export
  setPosition: (fen: string) => void
  loadPgn: (pgn: string) => void
}

export const useChessGame = create<ChessGameState>((set, get) => ({
  // Initial state
  game: new Chess(),
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'w',
  isGameOver: false,
  gameResult: 'Game in Progress',
  moveHistory: [],
  currentMoveIndex: -1,
  settings: {
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
  },

  // Actions
  makeMove: (move) => {
    const { game } = get()
    try {
      const result = game.move(move)
      if (result) {
        set({
          game: new Chess(game.fen()),
          fen: game.fen(),
          turn: game.turn() as 'w' | 'b',
          isGameOver: game.isGameOver(),
          gameResult: getGameResultText(game),
          moveHistory: getHistory(game),
          currentMoveIndex: -1, // Reset to end when making a new move
        })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  undoMove: () => {
    const { game } = get()
    try {
      game.undo()
      set({
        game: new Chess(game.fen()),
        fen: game.fen(),
        turn: game.turn() as 'w' | 'b',
        isGameOver: game.isGameOver(),
        gameResult: getGameResultText(game),
        moveHistory: getHistory(game),
        currentMoveIndex: Math.max(-1, get().currentMoveIndex - 1),
      })
    } catch {
      // Can't undo
    }
  },

  resetGame: () => {
    const game = new Chess()
    set({
      game,
      fen: game.fen(),
      turn: 'w',
      isGameOver: false,
      gameResult: 'Game in Progress',
      moveHistory: [],
      currentMoveIndex: -1,
    })
  },

  goToMove: (index) => {
    const { game } = get()
    const history = game.history({ verbose: true }) as any[]
    const newGame = new Chess()
    newGame.reset()
    
    for (let i = 0; i <= index && i < history.length; i++) {
      newGame.move(history[i])
    }
    
    set({
      game: newGame,
      fen: newGame.fen(),
      turn: newGame.turn() as 'w' | 'b',
      isGameOver: newGame.isGameOver(),
      gameResult: getGameResultText(newGame),
      currentMoveIndex: index,
    })
  },

  goToStart: () => {
    const { game } = get()
    const newGame = new Chess()
    newGame.reset()
    set({
      game: newGame,
      fen: newGame.fen(),
      turn: 'w',
      isGameOver: false,
      gameResult: 'Game in Progress',
      currentMoveIndex: -1,
    })
  },

  goToEnd: () => {
    const { game, moveHistory } = get()
    set({
      game: new Chess(game.fen()),
      fen: game.fen(),
      turn: game.turn() as 'w' | 'b',
      isGameOver: game.isGameOver(),
      gameResult: getGameResultText(game),
      currentMoveIndex: moveHistory.length - 1,
    })
  },

  goForward: () => {
    const { currentMoveIndex, moveHistory } = get()
    if (currentMoveIndex < moveHistory.length - 1) {
      get().goToMove(currentMoveIndex + 1)
    }
  },

  goBack: () => {
    const { currentMoveIndex } = get()
    if (currentMoveIndex > -1) {
      get().goToMove(currentMoveIndex - 1)
    }
  },

  setOrientation: (orientation) => {
    set((state) => ({
      settings: { ...state.settings, orientation },
    }))
  },

  toggleCoordinates: () => {
    set((state) => ({
      settings: { ...state.settings, showCoordinates: !state.settings.showCoordinates },
    }))
  },

  setAnimationSpeed: (animationSpeed) => {
    set((state) => ({
      settings: { ...state.settings, animationSpeed },
    }))
  },

  setPosition: (fen) => {
    try {
      const game = new Chess(fen)
      set({
        game,
        fen,
        turn: game.turn() as 'w' | 'b',
        isGameOver: game.isGameOver(),
        gameResult: getGameResultText(game),
        moveHistory: getHistory(game),
        currentMoveIndex: -1,
      })
    } catch {
      // Invalid FEN
    }
  },

  loadPgn: (pgn) => {
    try {
      const game = new Chess()
      game.loadPgn(pgn)
      set({
        game,
        fen: game.fen(),
        turn: game.turn() as 'w' | 'b',
        isGameOver: game.isGameOver(),
        gameResult: getGameResultText(game),
        moveHistory: getHistory(game),
        currentMoveIndex: -1,
      })
    } catch {
      // Invalid PGN
    }
  },
}))

// Helper functions
function getGameResultText(game: Chess): string {
  if (game.isCheckmate()) return 'Checkmate'
  if (game.isDraw()) return 'Draw'
  if (game.isStalemate()) return 'Stalemate'
  if (game.isThreefoldRepetition()) return 'Threefold Repetition'
  if (game.isInsufficientMaterial()) return 'Insufficient Material'
  return 'Game in Progress'
}

function getHistory(game: Chess): GameMove[] {
  const history = game.history({ verbose: true }) as any[]
  return history.map(move => ({
    san: move.san,
    from: move.from,
    to: move.to,
    piece: move.piece,
    captured: move.captured,
    promotion: move.promotion,
    check: move.san?.includes('+') || false,
    checkmate: move.san?.includes('#') || false,
    castling: move.san === 'O-O' ? 'kingside' : move.san === 'O-O-O' ? 'queenside' : undefined,
  }))
}

export default useChessGame

