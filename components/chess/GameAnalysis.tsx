'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import { ChessBoard } from './ChessBoard'
import { PgnViewer } from './PGNViewer'
import { parsePgn } from '@/lib/chess/utils/chess-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Brain,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface GameAnalysisProps {
  pgn: string
  analysis?: {
    averageAccuracy: number
    blunders: number
    mistakes: number
    inaccuracies: number
    brilliantMoves: number
    openingPhase?: any
    middlegamePhase?: any
    endgamePhase?: any
  }
  playerColor?: 'white' | 'black'
}

interface MoveAnalysis {
  moveNumber: number
  san: string
  fen: string
  evaluation: number
  bestMove: string
  severity: 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'none'
}

export function GameAnalysis({ pgn, analysis, playerColor = 'white' }: GameAnalysisProps) {
  const [game, setGame] = useState<Chess>(new Chess())
  const [currentMove, setCurrentMove] = useState(-1)
  const [parsedPgn, setParsedPgn] = useState(() => parsePgn(pgn))
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1000)
  const [activeTab, setActiveTab] = useState('moves')
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize game from PGN
  useEffect(() => {
    try {
      const newGame = new Chess()
      const moves = parsedPgn.moves.map(m => m.san)
      for (const san of moves) {
        newGame.move(san)
      }
      setGame(newGame)
    } catch (error) {
      console.error('Failed to load PGN:', error)
    }
  }, [parsedPgn])

  // Generate move analysis data (mock data if not provided)
  const moveAnalysis = useMemo<MoveAnalysis[]>(() => {
    // In a real app, this would come from the API with engine analysis
    return parsedPgn.moves.map((move, index) => ({
      moveNumber: move.number,
      san: move.san,
      fen: move.fen,
      evaluation: (Math.random() - 0.5) * 3, // Mock evaluation between -1.5 and 1.5
      bestMove: '', // Would be the engine's best move
      severity: 'none' as const,
    }))
  }, [parsedPgn])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMoves = moveAnalysis.length
    return {
      totalMoves,
      accuracy: analysis?.averageAccuracy || 75 + Math.random() * 20,
      blunders: analysis?.blunders || Math.floor(Math.random() * 3),
      mistakes: analysis?.mistakes || Math.floor(Math.random() * 5),
      inaccuracies: analysis?.inaccuracies || Math.floor(Math.random() * 8),
      brilliantMoves: analysis?.brilliantMoves || Math.floor(Math.random() * 3),
    }
  }, [moveAnalysis, analysis])

  // Evaluation chart data
  const evaluationData = useMemo(() => {
    return moveAnalysis.map((move, index) => ({
      move: index + 1,
      evaluation: move.evaluation,
    }))
  }, [moveAnalysis])

  // Chart data
  const pieData = [
    { name: 'Brilliant', value: stats.brilliantMoves, color: '#22c55e' },
    { name: 'Good', value: stats.totalMoves - stats.blunders - stats.mistakes - stats.inaccuracies - stats.brilliantMoves, color: '#3b82f6' },
    { name: 'Inaccuracies', value: stats.inaccuracies, color: '#eab308' },
    { name: 'Mistakes', value: stats.mistakes, color: '#f97316' },
    { name: 'Blunders', value: stats.blunders, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const barData = [
    { phase: 'Opening', accuracy: analysis?.openingPhase?.accuracy || 85 },
    { phase: 'Middlegame', accuracy: analysis?.middlegamePhase?.accuracy || 72 },
    { phase: 'Endgame', accuracy: analysis?.endgamePhase?.accuracy || 78 },
  ]

  const getResultText = () => {
    const result = parsedPgn.headers.Result
    if (!result) return 'Game in Progress'
    if (result === '1-0') return playerColor === 'white' ? 'You Won!' : 'You Lost'
    if (result === '0-1') return playerColor === 'white' ? 'You Lost' : 'You Won!'
    return 'Draw'
  }

  const getResultColor = () => {
    const result = parsedPgn.headers.Result
    if (!result) return 'text-gray-600'
    if (result === '1-0') return playerColor === 'white' ? 'text-green-600' : 'text-red-600'
    if (result === '0-1') return playerColor === 'white' ? 'text-red-600' : 'text-green-600'
    return 'text-yellow-600'
  }

  const navigateToMove = useCallback((moveIndex: number) => {
    const tempGame = new Chess()
    const moves = parsedPgn.moves.map(m => m.san)
    
    for (let i = 0; i <= moveIndex && i < moves.length; i++) {
      tempGame.move(moves[i])
    }
    
    setGame(tempGame)
    setCurrentMove(moveIndex)
  }, [parsedPgn])

  const handleMoveClick = useCallback((moveIndex: number) => {
    navigateToMove(moveIndex)
  }, [navigateToMove])

  const goToStart = useCallback(() => {
    const tempGame = new Chess()
    setGame(tempGame)
    setCurrentMove(-1)
  }, [])

  const goToEnd = useCallback(() => {
    navigateToMove(parsedPgn.moves.length - 1)
  }, [navigateToMove, parsedPgn.moves.length])

  const goBack = useCallback(() => {
    if (currentMove >= 0) {
      navigateToMove(currentMove - 1)
    }
  }, [currentMove, navigateToMove])

  const goForward = useCallback(() => {
    if (currentMove < parsedPgn.moves.length - 1) {
      navigateToMove(currentMove + 1)
    }
  }, [currentMove, parsedPgn.moves.length, navigateToMove])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && currentMove < parsedPgn.moves.length - 1) {
      playIntervalRef.current = setInterval(() => {
        goForward()
      }, playSpeed)
    } else {
      setIsPlaying(false)
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, currentMove, parsedPgn.moves.length, playSpeed, goForward])

  const togglePlay = useCallback(() => {
    if (currentMove >= parsedPgn.moves.length - 1) {
      goToStart()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, currentMove, parsedPgn.moves.length, goToStart])

  const getCurrentEvaluation = () => {
    if (currentMove < 0 || currentMove >= moveAnalysis.length) return 0
    return moveAnalysis[currentMove].evaluation
  }

  const formatEvaluation = (evaluation: number) => {
    if (Math.abs(evaluation) > 10) return 'M' + Math.floor(Math.abs(evaluation))
    return evaluation.toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Chess.com-style Layout */}
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Chess Board */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* Board Container */}
            <Card className="overflow-hidden shadow-xl border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <ChessBoard
                    initialFen={game.fen()}
                    orientation={playerColor}
                    showControls={false}
                    showMoveHistory={false}
                    readOnly={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{stats.accuracy.toFixed(0)}%</div>
                  <div className="text-xs text-blue-600 font-medium mt-1">Accuracy</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{stats.brilliantMoves}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">Brilliant</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{stats.blunders}</div>
                  <div className="text-xs text-red-600 font-medium mt-1">Blunders</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Middle Column: Move List & Evaluation */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Evaluation Graph */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evaluationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="move" stroke="#64748b" />
                      <YAxis domain={[-3, 3]} stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="evaluation" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Current Evaluation */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Current Position</div>
                  <div className={`text-lg font-bold ${
                    getCurrentEvaluation() > 0 ? 'text-green-600' : 
                    getCurrentEvaluation() < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {formatEvaluation(getCurrentEvaluation())}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Move List */}
            <Card className="shadow-lg border-0 bg-white flex flex-col" style={{ maxHeight: '600px' }}>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Move List
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={goToStart} className="h-8 w-8">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={goForward} className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-0">
                <PgnViewer
                  pgn={pgn}
                  headers={parsedPgn.headers}
                  currentMove={currentMove}
                  onMoveClick={handleMoveClick}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Analysis & Stats */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Game Result */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                <div className={`text-3xl font-bold mb-2 ${getResultColor()}`}>
                  {getResultText()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {parsedPgn.headers.White} vs {parsedPgn.headers.Black}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Tabs */}
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-3">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* Move Quality Pie Chart */}
                    {pieData.length > 0 && (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Detailed Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-green-900">Brilliant</span>
                        </div>
                        <span className="font-bold text-green-700">{stats.brilliantMoves}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-900">Good</span>
                        </div>
                        <span className="font-bold text-blue-700">
                          {stats.totalMoves - stats.blunders - stats.mistakes - stats.inaccuracies - stats.brilliantMoves}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-yellow-900">Inaccuracies</span>
                        </div>
                        <span className="font-bold text-yellow-700">{stats.inaccuracies}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-orange-600" />
                          <span className="font-medium text-orange-900">Mistakes</span>
                        </div>
                        <span className="font-bold text-orange-700">{stats.mistakes}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-900">Blunders</span>
                        </div>
                        <span className="font-bold text-red-700">{stats.blunders}</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="insights" className="space-y-4 mt-4">
                    {/* Phase Analysis */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Phase Performance
                      </h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="phase" stroke="#64748b" />
                            <YAxis domain={[0, 100]} stroke="#64748b" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar dataKey="accuracy" fill="#2563eb" name="Accuracy %" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Moves</span>
                        <span className="font-medium">{stats.totalMoves}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Time Control</span>
                        <span className="font-medium">{parsedPgn.headers.TimeControl || 'N/A'}</span>
                      </div>
                      {parsedPgn.headers.Opening && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Opening</span>
                          <span className="font-medium">{parsedPgn.headers.ECO} {parsedPgn.headers.Opening}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameAnalysis
