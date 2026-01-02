'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GameAnalysis } from '@/components/chess/GameAnalysis'
import { Chess } from 'chess.js'
import { apiFetch } from '@/lib/api/fetch'

interface GameData {
  id: string
  pgn: string
  result: string
  playerColor: string
  opponent: string
  opponentRating?: number | null
  timeControl: string
  date: string
  opening?: string | null
  openingEco?: string | null
  accuracy?: number | null
  analysis?: any
}

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const [game, setGame] = useState<GameData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await apiFetch(`/api/games/${params.id}`)
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - Please log in again')
          } else if (response.status === 404) {
            throw new Error('Game not found')
          } else {
            throw new Error('Failed to fetch game')
          }
        }
        const data = await response.json()
        setGame(data.game)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchGame()
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-red-200 max-w-md">
          <p className="text-red-600 text-lg font-semibold mb-4">{error || 'Game not found'}</p>
          <Button onClick={() => router.push('/dashboard')} className="btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Determine player color based on headers
  let playerColor: 'white' | 'black' = 'white'
  const whiteMatch = game.pgn.match(/\[White\s+"([^"]+)"\]/)
  if (whiteMatch) {
    playerColor = game.playerColor as 'white' | 'black'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                vs {game.opponent}
                {game.opponentRating && (
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    ({game.opponentRating})
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                <span>{new Date(game.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{game.timeControl}</span>
                {game.opening && (
                  <>
                    <span>•</span>
                    <span className="font-medium">
                      {game.openingEco} {game.opening}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto">
        <GameAnalysis
          pgn={game.pgn}
          analysis={game.analysis}
          playerColor={playerColor}
        />
      </div>
    </div>
  )
}
