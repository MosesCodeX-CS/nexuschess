'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Chess } from 'chess.js'
import ChessBoard from '@/components/chess/ChessBoard'
import MoveList from '@/components/chess/MoveList'
import AnalysisPanel from '@/components/chess/AnalysisPanel'
import EvaluationBar from '@/components/chess/EvaluationBar'
import VerticalEvaluationBar from '@/components/chess/VerticalEvaluationBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string

  const [game, setGame] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [mistakes, setMistakes] = useState<any[]>([])
  const [chess] = useState(new Chess())
  const [currentPosition, setCurrentPosition] = useState('start')
  const [currentMove, setCurrentMove] = useState(0)
  const [moves, setMoves] = useState<any[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentEvaluation, setCurrentEvaluation] = useState(0)

  useEffect(() => {
    fetchGameAndAnalysis()
  }, [gameId])

  const fetchGameAndAnalysis = async () => {
    const token = localStorage.getItem('nexuschess_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      // Fetch game details
      const gameResponse = await fetch(`/api/games/${gameId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!gameResponse.ok) {
        router.push('/games')
        return
      }

      const gameData = await gameResponse.json()
      setGame(gameData.game)

      // Load PGN and extract moves
      chess.loadPgn(gameData.game.pgn)
      const history = chess.history({ verbose: true })
      
      const formattedMoves = []
      for (let i = 0; i < history.length; i += 2) {
        formattedMoves.push({
          moveNumber: Math.floor(i / 2) + 1,
          white: history[i]?.san,
          black: history[i + 1]?.san
        })
      }
      setMoves(formattedMoves)

      // Check if analysis exists
      if (gameData.game.analysis) {
        setAnalysis(gameData.game.analysis)
        setMistakes(gameData.game.mistakes || [])
        // Set initial evaluation from analysis if available
        setCurrentEvaluation(gameData.game.analysis.averageEvaluation || 0)
      }
    } catch (error) {
      console.error('Error fetching game:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    const token = localStorage.getItem('nexuschess_token')
    if (!token) return

    setAnalyzing(true)

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameId })
      })

      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
        setMistakes(data.mistakes || [])
      }
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleMoveClick = (moveIndex: number) => {
    chess.reset()
    const history = chess.history({ verbose: true })
    
    for (let i = 0; i <= moveIndex * 2 + 1; i++) {
      if (i < history.length) {
        chess.move(history[i].san)
      }
    }
    
    setCurrentPosition(chess.fen())
    setCurrentMove(moveIndex)
    
    // Update evaluation based on current position (simplified logic)
    // In a real implementation, this would use a chess engine
    const evaluation = chess.turn() === 'w' ? 0.1 : -0.1 // Simple placeholder
    setCurrentEvaluation(evaluation)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading game...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Game not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Game Analysis</h1>
            <p className="text-gray-600">
              vs {game.opponent} • {new Date(game.date).toLocaleDateString()}
            </p>
          </div>
          <Button onClick={() => router.push('/games')} variant="outline">
            Back to Games
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Board and Controls */}
          <div className="xl:col-span-3 space-y-6">
            {/* Game Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      Playing as {game.playerColor}
                    </p>
                    <p className="text-sm text-gray-600">
                      {game.timeControl} • {game.opening || 'Unknown Opening'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${
                      game.result === 'win' ? 'text-green-600' : 
                      game.result === 'loss' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {game.result === 'win' ? '1-0' : game.result === 'loss' ? '0-1' : '½-½'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Board and Move List Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chess Board with Evaluation Bar */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Vertical Evaluation Bar */}
                  <div className="lg:col-span-1 flex justify-center">
                    <VerticalEvaluationBar
                      evaluation={currentEvaluation}
                      orientation="white"
                      height={400}
                    />
                  </div>
                  
                  {/* Chess Board */}
                  <div className="lg:col-span-11 space-y-4">
                    {/* Chess Board */}
                    <ChessBoard
                      initialFen={currentPosition}
                      readOnly={true}
                    />

                    {/* Analysis Button */}
                    {!analysis && (
                      <Button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="w-full"
                        size="lg"
                      >
                        {analyzing ? 'Analyzing with Stockfish...' : 'Analyze Game with Engine'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Move List - Now on the side */}
              <div className="lg:col-span-1">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Moves</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <MoveList
                      moves={moves}
                      mistakes={mistakes}
                      currentMove={currentMove}
                      onMoveClick={handleMoveClick}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Column - Analysis */}
          <div className="xl:col-span-1">
            <AnalysisPanel analysis={analysis} loading={analyzing} />

            {/* Mistakes List */}
            {mistakes.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Mistakes to Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mistakes.map((mistake, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => handleMoveClick(mistake.moveNumber - 1)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              Move {mistake.moveNumber}: {mistake.playedMove}
                            </p>
                            <p className="text-sm text-gray-600">
                              Best: {mistake.bestMove}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            mistake.severity === 'blunder' ? 'bg-red-100 text-red-600' :
                            mistake.severity === 'mistake' ? 'bg-orange-100 text-orange-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {mistake.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">
                          {mistake.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}