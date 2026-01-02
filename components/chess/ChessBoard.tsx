'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard as ReactChessboard } from 'react-chessboard'
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Play, 
  Pause, 
  Settings, 
  Maximize2,
  Eye,
  EyeOff,
  RotateCw,
  Download,
  Upload,
  Copy,
  Check,
  Square,
  Circle,
  Target,
  Zap,
  Clock,
  MousePointer,
  Move
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  createChessGame,
  makeMove,
  undoMove,
  resetGame,
  getLegalMoves,
  getGameResult,
  getMoveHistory,
  navigateToMove,
  isValidMove,
} from '@/lib/chess/utils/chess-utils'
import type { GameSettings, GameMove, Premove, MoveHint } from '@/lib/chess/types/chess'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'

interface ChessBoardProps {
  initialFen?: string
  onMove?: (move: { from: string; to: string; fen: string; san: string }) => void
  onGameStateChange?: (gameState: { fen: string; isGameOver: boolean; result: string }) => void
  readOnly?: boolean
  orientation?: 'white' | 'black'
  showControls?: boolean
  showMoveHistory?: boolean
  allowPremoves?: boolean
}

export function ChessBoard({
  initialFen,
  onMove,
  onGameStateChange,
  readOnly = false,
  orientation: initialOrientation = 'white',
  showControls = true,
  showMoveHistory = true,
  allowPremoves = true,
}: ChessBoardProps) {
  const [game, setGame] = useState<Chess>(() => createChessGame(initialFen))
  const [gameState, setGameState] = useState({
    fen: game.fen(),
    isGameOver: game.isGameOver(),
    result: getGameResult(game),
  })
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1000)
  const [orientation, setOrientation] = useState<'white' | 'black'>(initialOrientation)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [moveFrom, setMoveFrom] = useState<string | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<string[]>([])
  const [premove, setPremove] = useState<Premove | null>(null)
  const [moveHints, setMoveHints] = useState<MoveHint[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, any>>({})
  const [moveNotation, setMoveNotation] = useState('')
  const [copied, setCopied] = useState(false)
  
  const [settings, setSettings] = useState<GameSettings>({
    orientation: initialOrientation,
    showCoordinates: true,
    showLastMove: true,
    showPossibleMoves: true,
    showMoveHints: true,
    animationSpeed: 300,
    premoveEnabled: true,
    moveHintsEnabled: true,
    highlightLastMove: true,
    highlightCheck: true,
    highlightLegalMoves: true,
    autoQueen: true,
    confirmResign: true,
    soundEnabled: true,
    boardTheme: 'green',
    pieceSet: 'standard',
    moveMode: 'drag', // 'drag', 'click', or 'both'
    autoPromoteToQueen: true,
    clickToMove: true,
  })
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const moveHistory = useMemo(() => getMoveHistory(game), [game.fen()])
  const lastMove = useMemo(() => {
    const history = game.history({ verbose: true })
    return history.length > 0 ? history[history.length - 1] : null
  }, [game])

  // Refs for cleanup
  const premoveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const soundRef = useRef<HTMLAudioElement>(null)

  // Initialize audio for move sounds
  useEffect(() => {
    soundRef.current = new Audio('/sounds/move.mp3')
  }, [])

  // Update game state when chess instance changes
  useEffect(() => {
    const newGameState = {
      fen: game.fen(),
      isGameOver: game.isGameOver(),
      result: getGameResult(game),
    }
    setGameState(newGameState)
    onGameStateChange?.(newGameState)
    
    // Execute premove if available
    if (premove && !readOnly && allowPremoves && settings.premoveEnabled) {
      const isPremoveTurn = premove.color === game.turn()
      if (isPremoveTurn) {
        // Wait a bit for visual feedback
        if (premoveTimeoutRef.current) {
          clearTimeout(premoveTimeoutRef.current)
        }
        
        premoveTimeoutRef.current = setTimeout(() => {
          executePremove()
        }, 150)
      }
    }
    
    // Clear selected square on turn change
    setSelectedSquare(null)
    setMoveFrom(null)
    setPossibleMoves([])
  }, [game, onGameStateChange, premove, readOnly, allowPremoves, settings.premoveEnabled])

  // Play move sound
  const playMoveSound = useCallback(() => {
    if (settings.soundEnabled && soundRef.current) {
      soundRef.current.currentTime = 0
      soundRef.current.play().catch(() => {})
    }
  }, [settings.soundEnabled])

  // Get legal moves for a square
  const getPossibleMoves = useCallback((square: string) => {
    const moves = game.moves({ square: square as any, verbose: true }) as any[]
    return moves.map(move => ({
      to: move.to,
      san: move.san,
      promotion: move.promotion,
      flags: move.flags,
    }))
  }, [game])

  // Handle square click (for click-to-move)
  const handleSquareClick = useCallback((square: string) => {
    if (readOnly || game.isGameOver() || settings.moveMode === 'drag') return

    const piece = game.get(square as any)
    
    // If no piece selected and we clicked an empty square or opponent's piece
    if (!selectedSquare) {
      if (piece && piece.color === game.turn()) {
        // Select piece
        setSelectedSquare(square)
        setMoveFrom(square)
        const moves = getPossibleMoves(square)
        setPossibleMoves(moves.map(m => m.to))
      }
      return
    }

    // If clicking same square, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null)
      setMoveFrom(null)
      setPossibleMoves([])
      return
    }

    // If clicking another piece of same color
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square)
      setMoveFrom(square)
      const moves = getPossibleMoves(square)
      setPossibleMoves(moves.map(m => m.to))
      return
    }

    // Try to make move
    const moveResult = makeMove(game, { 
      from: selectedSquare as any, 
      to: square as any,
      promotion: settings.autoQueen ? 'q' : undefined
    })
    
    if (moveResult.success) {
      playMoveSound()
      setGame(new Chess(game.fen()))
      setCurrentMoveIndex(-1)
      setSelectedSquare(null)
      setMoveFrom(null)
      setPossibleMoves([])
      
      onMove?.({
        from: selectedSquare,
        to: square,
        fen: game.fen(),
        san: moveResult.move?.san || '',
      })
    } else {
      // If move failed, check if it's a premove
      if (settings.premoveEnabled && allowPremoves) {
        const premoveObj = {
          from: selectedSquare,
          to: square,
          color: game.turn(),
          san: '',
        }
        setPremove(premoveObj)
        // Show visual feedback for premove
        setTimeout(() => {
          setSelectedSquare(null)
          setMoveFrom(null)
          setPossibleMoves([])
        }, 300)
      }
    }
  }, [game, selectedSquare, readOnly, settings.moveMode, settings.premoveEnabled, settings.autoQueen, allowPremoves, onMove, playMoveSound, getPossibleMoves])

  // Execute premove
  const executePremove = useCallback(() => {
    if (!premove) return false
    
    const moveResult = makeMove(game, { 
      from: premove.from as any, 
      to: premove.to as any,
      promotion: settings.autoQueen ? 'q' : undefined
    })
    
    if (moveResult.success) {
      playMoveSound()
      setGame(new Chess(game.fen()))
      setCurrentMoveIndex(-1)
      setPremove(null)
      
      onMove?.({
        from: premove.from,
        to: premove.to,
        fen: game.fen(),
        san: moveResult.move?.san || '',
      })
      return true
    }
    
    setPremove(null)
    return false
  }, [game, premove, settings.autoQueen, onMove, playMoveSound])

  // Handle piece drop
  const handlePieceDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string) => {
    if (readOnly || game.isGameOver()) return false

    const moveResult = makeMove(game, { 
      from: sourceSquare as any, 
      to: targetSquare as any,
      promotion: settings.autoQueen && piece.endsWith('Q') ? 'q' : undefined
    })
    
    if (moveResult.success) {
      playMoveSound()
      setGame(new Chess(game.fen()))
      setCurrentMoveIndex(-1)
      setSelectedSquare(null)
      setMoveFrom(null)
      setPossibleMoves([])
      
      onMove?.({
        from: sourceSquare,
        to: targetSquare,
        fen: game.fen(),
        san: moveResult.move?.san || '',
      })
      return true
    }
    
    // If move failed but premove is enabled, set as premove
    if (settings.premoveEnabled && allowPremoves) {
      const premoveObj = {
        from: sourceSquare,
        to: targetSquare,
        color: game.turn(),
        san: '',
      }
      setPremove(premoveObj)
      return true // Return true to allow visual feedback
    }
    
    return false
  }, [game, readOnly, settings.premoveEnabled, settings.autoQueen, allowPremoves, onMove, playMoveSound])

  // Handle piece drag start
  const handlePieceDragBegin = useCallback((piece: string, sourceSquare: string) => {
    if (readOnly) return
    setIsDragging(true)
    setMoveFrom(sourceSquare)
    
    if (settings.showPossibleMoves) {
      const moves = getPossibleMoves(sourceSquare)
      setPossibleMoves(moves.map(m => m.to))
    }
  }, [readOnly, settings.showPossibleMoves, getPossibleMoves])

  // Handle piece drag end
  const handlePieceDragEnd = useCallback(() => {
    setIsDragging(false)
    setMoveFrom(null)
    setPossibleMoves([])
  }, [])

  // Handle right click
  const handleSquareRightClick = useCallback((square: string) => {
    if (readOnly) return
    
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]: rightClickedSquares[square]
        ? null
        : { backgroundColor: 'rgba(255, 0, 0, 0.4)' },
    })
  }, [readOnly, rightClickedSquares])

  // Custom square styles
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {}
    
    // Selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
        borderRadius: '50%',
      }
    }
    
    // Move from square (when dragging)
    if (moveFrom) {
      styles[moveFrom] = {
        backgroundColor: 'rgba(255, 255, 0, 0.6)',
      }
    }
    
    // Possible move targets
    possibleMoves.forEach(square => {
      styles[square] = {
        ...styles[square],
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        borderRadius: '50%',
      }
    })
    
    // Premove visualization
    if (premove) {
      styles[premove.from] = {
        ...styles[premove.from],
        backgroundColor: 'rgba(255, 165, 0, 0.6)',
      }
      styles[premove.to] = {
        ...styles[premove.to],
        backgroundColor: 'rgba(255, 165, 0, 0.4)',
        borderRadius: '50%',
      }
    }
    
    // Last move highlight
    if (settings.highlightLastMove && lastMove) {
      styles[lastMove.from] = {
        ...styles[lastMove.from],
        backgroundColor: 'rgba(135, 206, 250, 0.6)',
      }
      styles[lastMove.to] = {
        ...styles[lastMove.to],
        backgroundColor: 'rgba(135, 206, 250, 0.6)',
      }
    }
    
    // Check highlight
    if (settings.highlightCheck && game.inCheck()) {
      const kingSquare = game.board().flat().find(sq => sq && sq.type === 'k' && sq.color === game.turn())?.square
      if (kingSquare) {
        styles[kingSquare] = {
          ...styles[kingSquare],
          backgroundColor: 'rgba(255, 0, 0, 0.6)',
        }
      }
    }
    
    // Merge with right clicked squares
    return { ...styles, ...rightClickedSquares }
  }, [selectedSquare, moveFrom, possibleMoves, premove, settings.highlightLastMove, settings.highlightCheck, lastMove, game, rightClickedSquares])

  // Generate move hints (simple center control for now)
  useEffect(() => {
    if (!settings.moveHintsEnabled || game.isGameOver()) {
      setMoveHints([])
      return
    }

    const hints: MoveHint[] = []
    const board = game.board()
    
    // Simple hint: prioritize controlling center
    const centerSquares = ['d4', 'e4', 'd5', 'e5']
    centerSquares.forEach(square => {
      hints.push({
        square,
        type: 'center-control',
        strength: 0.8,
      })
    })
    
    setMoveHints(hints)
  }, [game.fen(), settings.moveHintsEnabled])

  // Navigate through move history
  const goToMove = useCallback((moveIndex: number) => {
    const moves = game.history({ verbose: true }) as { from: string; to: string }[]
    const targetIndex = Math.max(-1, Math.min(moveIndex, moves.length - 1))
    
    const tempGame = new Chess()
    
    for (let i = 0; i <= targetIndex; i++) {
      tempGame.move(moves[i])
    }
    
    setGame(tempGame)
    setCurrentMoveIndex(targetIndex)
    setPremove(null) // Clear premove when navigating history
  }, [game])

  const goToStart = useCallback(() => goToMove(-1), [goToMove])
  const goToEnd = useCallback(() => goToMove(moveHistory.length - 1), [goToMove, moveHistory.length])
  const goBack = useCallback(() => goToMove(currentMoveIndex - 1), [goToMove, currentMoveIndex])
  const goForward = useCallback(() => goToMove(currentMoveIndex + 1), [goToMove, currentMoveIndex])

  // Undo last move
  const handleUndo = useCallback(() => {
    if (readOnly) return
    const undone = undoMove(game)
    if (undone) {
      setGame(new Chess(game.fen()))
      setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1))
      setPremove(null)
    }
  }, [game, readOnly, currentMoveIndex])

  // Reset game
  const handleReset = useCallback(() => {
    if (readOnly) return
    if (settings.confirmResign && !confirm('Are you sure you want to reset the game?')) {
      return
    }
    resetGame(game)
    setGame(new Chess())
    setCurrentMoveIndex(-1)
    setPremove(null)
    setSelectedSquare(null)
    setMoveFrom(null)
    setPossibleMoves([])
  }, [game, readOnly, settings.confirmResign])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Copy FEN to clipboard
  const copyFEN = useCallback(() => {
    navigator.clipboard.writeText(game.fen())
    setCopied(true)
    toast({
      title: "FEN copied!",
      description: "Position has been copied to clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }, [game])

  // Import FEN
  const importFEN = useCallback(() => {
    const fen = prompt('Enter FEN string:')
    if (fen) {
      try {
        const tempGame = new Chess(fen)
        setGame(tempGame)
        setCurrentMoveIndex(-1)
        setPremove(null)
        toast({
          title: "FEN imported!",
          description: "Position has been loaded",
        })
      } catch {
        toast({
          title: "Invalid FEN",
          description: "The FEN string is invalid",
          variant: "destructive",
        })
      }
    }
  }, [])

  // Export PGN
  const exportPGN = useCallback(() => {
    const pgn = game.pgn()
    const blob = new Blob([pgn], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chess-game-${new Date().toISOString().slice(0, 10)}.pgn`
    a.click()
    URL.revokeObjectURL(url)
  }, [game])

  // Board width calculation
  const boardWidth = isFullscreen ? Math.min(window.innerWidth - 100, 800) : Math.min(600, 500)

  // Chessboard options for v5 API
  const chessboardOptions = useMemo(() => ({
    position: game.fen(),
    boardOrientation: orientation,
    boardStyle: {
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      width: `${boardWidth}px`,
      height: `${boardWidth}px`,
    },
    darkSquareStyle: {
      backgroundColor: settings.boardTheme === 'green' ? '#739552' : 
                      settings.boardTheme === 'blue' ? '#7a9ac7' : 
                      settings.boardTheme === 'brown' ? '#b58863' : '#739552',
    },
    lightSquareStyle: {
      backgroundColor: settings.boardTheme === 'green' ? '#EBF0E5' : 
                      settings.boardTheme === 'blue' ? '#dee3e6' : 
                      settings.boardTheme === 'brown' ? '#f0d9b5' : '#EBF0E5',
    },
    squareStyles: customSquareStyles,
    animationDurationInMs: settings.animationSpeed,
    showNotation: settings.showCoordinates,
    allowDragging: !readOnly && settings.moveMode !== 'click',
    onPieceDrop: ({ sourceSquare, targetSquare, piece }: { sourceSquare: string; targetSquare: string | null; piece: { pieceType: string } }) => {
      if (!targetSquare) return false
      return handlePieceDrop(sourceSquare, targetSquare, piece.pieceType)
    },
    onSquareClick: ({ square }: { square: string; piece: { pieceType: string } | null }) => {
      handleSquareClick(square)
    },
    onSquareRightClick: ({ square }: { square: string; piece: { pieceType: string } | null }) => {
      handleSquareRightClick(square)
    },
    canDragPiece: ({ isSparePiece, piece, square }: { isSparePiece: boolean; piece: { pieceType: string }; square: string | null }) => {
      if (readOnly) return false
      if (!square) return false
      const pieceType = piece.pieceType
      return pieceType.startsWith('w') ? game.turn() === 'w' : game.turn() === 'b'
    },
    onPieceDrag: ({ isSparePiece, piece, square }: { isSparePiece: boolean; piece: { pieceType: string }; square: string | null }) => {
      if (readOnly || !square) return
      if (!isDragging) {
        handlePieceDragBegin(piece.pieceType, square)
      }
    },
  }), [
    game,
    orientation,
    boardWidth,
    settings.boardTheme,
    settings.animationSpeed,
    settings.showCoordinates,
    settings.moveMode,
    customSquareStyles,
    readOnly,
    handlePieceDrop,
    handleSquareClick,
    handleSquareRightClick,
    handlePieceDragBegin,
    isDragging,
  ])

  return (
    <div className={`flex flex-col gap-4 ${isFullscreen ? 'p-4' : ''}`}>
      {/* Chess Board */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: `${boardWidth}px`, height: `${boardWidth}px` }}>
          <ReactChessboard options={chessboardOptions} />
          
          {/* Move hints overlay */}
          {settings.moveHintsEnabled && moveHints.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {moveHints.map((hint, index) => (
                <div
                  key={index}
                  className="absolute rounded-full border-2 border-yellow-400 opacity-50"
                  style={{
                    width: `${boardWidth / 8}px`,
                    height: `${boardWidth / 8}px`,
                    left: `${((hint.square.charCodeAt(0) - 97) * boardWidth) / 8}px`,
                    top: `${orientation === 'white' 
                      ? ((7 - parseInt(hint.square[1]) + 1) * boardWidth) / 8
                      : ((parseInt(hint.square[1]) - 1) * boardWidth) / 8}px`,
                    borderWidth: `${Math.max(1, hint.strength * 3)}px`,
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Premove indicator */}
          {premove && (
            <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-sm font-semibold">
              Premove set
            </div>
          )}
        </div>
      </div>

      {/* Game Status & Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Turn:</span>
                <span className={`px-2 py-1 rounded ${game.turn() === 'w' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'}`}>
                  {game.turn() === 'w' ? 'White' : 'Black'}
                </span>
              </div>
              
              {game.inCheck() && (
                <div className="bg-red-100 text-red-800 px-2 py-1 rounded font-semibold">
                  Check!
                </div>
              )}
              
              {premove && (
                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>Pmove</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyFEN}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Copy FEN</span>
              </Button>
              <Button variant="outline" size="sm" onClick={importFEN}>
                <Upload className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Import</span>
              </Button>
              <Button variant="outline" size="icon" onClick={toggleFullscreen} title="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Settings">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Board Settings</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="general">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="visual">Visual</TabsTrigger>
                      <TabsTrigger value="game">Game</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="orientation">Board Orientation</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOrientation(orientation === 'white' ? 'black' : 'white')}
                        >
                          {orientation === 'white' ? 'White' : 'Black'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="moveMode" className="flex items-center gap-2">
                          <Move className="h-4 w-4" />
                          Move Mode
                        </Label>
                        <select
                          id="moveMode"
                          className="border rounded px-2 py-1 text-sm"
                          value={settings.moveMode}
                          onChange={(e) => setSettings({ ...settings, moveMode: e.target.value as any })}
                        >
                          <option value="drag">Drag & Drop</option>
                          <option value="click">Click to Move</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="premove" className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Enable Premoves
                        </Label>
                        <Switch
                          id="premove"
                          checked={settings.premoveEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, premoveEnabled: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoQueen" className="flex items-center gap-2">
                          <Square className="h-4 w-4" />
                          Auto-promote to Queen
                        </Label>
                        <Switch
                          id="autoQueen"
                          checked={settings.autoQueen}
                          onCheckedChange={(checked) => setSettings({ ...settings, autoQueen: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="confirmResign" className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Confirm Resign/Reset
                        </Label>
                        <Switch
                          id="confirmResign"
                          checked={settings.confirmResign}
                          onCheckedChange={(checked) => setSettings({ ...settings, confirmResign: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sound" className="flex items-center gap-2">
                          🔊 Sound
                        </Label>
                        <Switch
                          id="sound"
                          checked={settings.soundEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="visual" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="animation">Animation Speed</Label>
                        <div className="w-32">
                          <Slider
                            id="animation"
                            min={0}
                            max={1000}
                            step={50}
                            value={[settings.animationSpeed]}
                            onValueChange={([value]) => setSettings({ ...settings, animationSpeed: value })}
                          />
                        </div>
                        <span className="text-sm w-16">{settings.animationSpeed}ms</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="coordinates" className="flex items-center gap-2">
                          # Coordinates
                        </Label>
                        <Switch
                          id="coordinates"
                          checked={settings.showCoordinates}
                          onCheckedChange={(checked) => setSettings({ ...settings, showCoordinates: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="moveHints" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Move Hints
                        </Label>
                        <Switch
                          id="moveHints"
                          checked={settings.moveHintsEnabled}
                          onCheckedChange={(checked) => setSettings({ ...settings, moveHintsEnabled: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lastMove" className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Highlight Last Move
                        </Label>
                        <Switch
                          id="lastMove"
                          checked={settings.highlightLastMove}
                          onCheckedChange={(checked) => setSettings({ ...settings, highlightLastMove: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="check" className="flex items-center gap-2">
                          ⚡ Highlight Check
                        </Label>
                        <Switch
                          id="check"
                          checked={settings.highlightCheck}
                          onCheckedChange={(checked) => setSettings({ ...settings, highlightCheck: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="legalMoves" className="flex items-center gap-2">
                          <Circle className="h-4 w-4" />
                          Show Legal Moves
                        </Label>
                        <Switch
                          id="legalMoves"
                          checked={settings.highlightLegalMoves}
                          onCheckedChange={(checked) => setSettings({ ...settings, highlightLegalMoves: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="boardTheme">Board Theme</Label>
                        <select
                          id="boardTheme"
                          className="border rounded px-2 py-1 text-sm"
                          value={settings.boardTheme}
                          onChange={(e) => setSettings({ ...settings, boardTheme: e.target.value as any })}
                        >
                          <option value="green">Green (Chess.com)</option>
                          <option value="blue">Blue</option>
                          <option value="brown">Brown (Lichess)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pieceSet">Piece Set</Label>
                        <select
                          id="pieceSet"
                          className="border rounded px-2 py-1 text-sm"
                          value={settings.pieceSet}
                          onChange={(e) => setSettings({ ...settings, pieceSet: e.target.value as any })}
                        >
                          <option value="standard">Standard</option>
                          <option value="alpha">Alpha</option>
                          <option value="california">California</option>
                        </select>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="game" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fen">Current FEN</Label>
                        <div className="flex gap-2">
                          <Input
                            id="fen"
                            value={game.fen()}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button variant="outline" size="icon" onClick={copyFEN}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Label>Game Actions</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={exportPGN}>
                            <Download className="h-4 w-4 mr-2" />
                            Export PGN
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                            <RotateCw className="h-4 w-4 mr-2" />
                            New Game
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Keyboard Shortcuts</Label>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><kbd className="bg-gray-100 px-2 py-1 rounded">Space</kbd> - Play/Pause AI</div>
                          <div><kbd className="bg-gray-100 px-2 py-1 rounded">Z</kbd> - Undo</div>
                          <div><kbd className="bg-gray-100 px-2 py-1 rounded">R</kbd> - Reset</div>
                          <div><kbd className="bg-gray-100 px-2 py-1 rounded">F</kbd> - Flip Board</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Game Result */}
          {gameState.isGameOver && (
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg text-center mb-4">
              <span className="font-semibold">Game Over: {gameState.result}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls & Move History */}
      {showControls && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="icon" onClick={goToStart} disabled={currentMoveIndex < 0}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goBack} disabled={currentMoveIndex < 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={game.isGameOver()}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goForward}
                  disabled={currentMoveIndex >= moveHistory.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToEnd} disabled={currentMoveIndex >= moveHistory.length - 1}>
                  <RotateCcw className="h-4 w-4 rotate-180" />
                </Button>
                
                {/* Speed control */}
                <div className="flex items-center gap-2 border rounded px-2">
                  <Label htmlFor="speed" className="text-xs">Speed:</Label>
                  <select
                    id="speed"
                    className="border-0 bg-transparent text-xs"
                    value={playSpeed}
                    onChange={(e) => setPlaySpeed(Number(e.target.value))}
                  >
                    <option value={500}>0.5s</option>
                    <option value={1000}>1s</option>
                    <option value={2000}>2s</option>
                  </select>
                </div>
                
                {!readOnly && (
                  <>
                    <Button variant="outline" size="icon" onClick={handleUndo} disabled={moveHistory.length === 0}>
                      <span className="text-xs">↩</span>
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                    <Button variant="destructive" onClick={handleReset}>
                      Resign
                    </Button>
                  </>
                )}
              </div>

              {/* Move History */}
              {showMoveHistory && (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Move History</h4>
                    <span className="text-sm text-gray-500">{moveHistory.length} moves</span>
                  </div>
                  {moveHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm">No moves yet</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 text-sm">
                      {moveHistory.reduce((acc: any[], move, index) => {
                        if (index % 2 === 0) {
                          acc.push({
                            moveNumber: Math.floor(index / 2) + 1,
                            white: move.san,
                            black: moveHistory[index + 1]?.san || '',
                          })
                        }
                        return acc
                      }, []).map((pair, pairIndex) => (
                        <div key={pairIndex} className="flex items-center gap-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                          <span className="font-mono text-gray-500 w-6">{pair.moveNumber}.</span>
                          <button
                            className={`flex-1 text-left p-1 rounded transition-colors ${
                              pairIndex * 2 === currentMoveIndex
                                ? 'bg-blue-100 dark:bg-blue-900'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            onClick={() => goToMove(pairIndex * 2)}
                          >
                            {pair.white}
                          </button>
                          {pair.black && (
                            <button
                              className={`flex-1 text-left p-1 rounded transition-colors ${
                                pairIndex * 2 + 1 === currentMoveIndex
                                  ? 'bg-blue-100 dark:bg-blue-900'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                              onClick={() => goToMove(pairIndex * 2 + 1)}
                            >
                              {pair.black}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Game Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">Current Position</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>FEN: <code className="text-xs">{game.fen().split(' ')[0]}</code></div>
                  <div>Turn: {game.turn() === 'w' ? 'White' : 'Black'}</div>
                  <div>Full move: {game.history().length + 1}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Status</h4>
                <div className="text-sm space-y-1">
                  <div className={game.inCheck() ? 'text-red-600 font-semibold' : ''}>
                    {game.inCheck() ? 'In Check' : 'No Check'}
                  </div>
                  <div>
                    {game.isGameOver() ? 'Game Over' : 'In Progress'}
                  </div>
                  {game.isDraw() && <div>Draw</div>}
                  {game.isStalemate() && <div>Stalemate</div>}
                  {game.isThreefoldRepetition() && <div>Threefold Repetition</div>}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Material Count</h4>
                <div className="text-sm space-y-1">
                  <div>White: {game.board().flat().filter(p => p && p.color === 'w').length} pieces</div>
                  <div>Black: {game.board().flat().filter(p => p && p.color === 'b').length} pieces</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ChessBoard