'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  TrendingUp,
  Trash2,
  ChessKnight,
  Trophy,
  TrendingDown,
  Minus,
  Zap,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { apiFetch } from '@/lib/api/fetch'
import { cn } from '@/lib/utils'

interface GameCardProps {
  game: {
    id: string
    pgn: string
    result: string
    playerColor: string
    opponent: string
    opponentRating?: number | null
    timeControl: string
    timeClass?: string | null
    date: Date
    opening?: string | null
    openingEco?: string | null
    accuracy?: number | null
  }
  onDelete?: (id: string) => void
  onView?: (id: string) => void
}

// Helper to normalize result format (handles both Chess.com format and PGN format)
const normalizeResult = (result: string, playerColor: string): 'win' | 'loss' | 'draw' => {
  const isWhite = playerColor === 'white'
  
  // Handle PGN format: '1-0', '0-1', '1/2-1/2'
  if (result === '1-0') return isWhite ? 'win' : 'loss'
  if (result === '0-1') return isWhite ? 'loss' : 'win'
  if (result === '1/2-1/2') return 'draw'
  
  // Handle Chess.com format - these are from the opponent's perspective
  const lowerResult = result.toLowerCase()
  
  // If the result is 'win', it means you won
  if (lowerResult === 'win') return 'win'
  
  // If the result is 'checkmated', 'timeout', 'resigned', 'insufficient', 'loss', it means you were the one who experienced this
  if (lowerResult === 'checkmated' || lowerResult === 'timeout' || lowerResult === 'resigned' || 
      lowerResult === 'loss' || lowerResult === 'insufficient') {
    return 'loss'
  }
  
  // If the result is 'draw' or 'agreed' or other draw formats
  if (lowerResult === 'draw' || lowerResult === 'agreed' || lowerResult === 'repetition' || 
      lowerResult === 'threefold' || lowerResult === 'fifty' || lowerResult === 'stalemate') {
    return 'draw'
  }
  
  // Default to loss if unknown format
  return 'loss'
}

export function GameCard({ game, onDelete, onView }: GameCardProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const normalizedResult = normalizeResult(game.result, game.playerColor)

  const getResultColor = () => {
    if (normalizedResult === 'win') return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' }
    if (normalizedResult === 'draw') return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'text-yellow-600' }
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-600' }
  }

  const getResultText = () => {
    // Return the actual result format instead of Won/Lost/Draw
    if (game.result === '1-0' || game.result === '0-1' || game.result === '1/2-1/2') {
      return game.result
    }
    
    // For Chess.com format, convert to standard score
    if (normalizedResult === 'win') return game.playerColor === 'white' ? '1-0' : '0-1'
    if (normalizedResult === 'draw') return '1/2-1/2'
    return game.playerColor === 'white' ? '0-1' : '1-0'
  }

  const getResultIcon = () => {
    if (normalizedResult === 'win') return Trophy
    if (normalizedResult === 'draw') return Minus
    return TrendingDown
  }

  const formatTimeControl = (tc: string) => {
    if (tc.includes('+')) {
      const parts = tc.split('+')
      const minutes = parseInt(parts[0])
      const increment = parts[1]
      if (minutes < 60) {
        return `${minutes}m + ${increment}s`
      } else {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m + ${increment}s` : `${hours}h + ${increment}s`
      }
    }
    const seconds = parseInt(tc)
    if (!isNaN(seconds)) {
      if (seconds < 60) return `${seconds}s`
      const minutes = Math.floor(seconds / 60)
      return `${minutes}m`
    }
    if (tc === '∞') return 'Unlimited'
    return tc
  }

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/games/${game.id}`, { method: 'DELETE' })
      onDelete?.(game.id)
    } catch (error) {
      console.error('Failed to delete game:', error)
    }
    setShowDeleteConfirm(false)
  }

  const handleView = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    onView?.(game.id)
    router.push(`/games/${game.id}`)
  }

  const resultColors = getResultColor()
  const ResultIcon = getResultIcon()
  const timeClassLabel = game.timeClass ? game.timeClass.charAt(0).toUpperCase() + game.timeClass.slice(1) : null

  return (
    <>
      <Card 
        className={cn(
          "card-hover cursor-pointer group border-2 bg-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden",
          resultColors.border,
          isHovered && "ring-2 ring-blue-500 ring-offset-2"
        )}
        onClick={handleView}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-5">
          {/* Header with opponent and result */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform group-hover:scale-110",
                resultColors.bg
              )}>
                <ChessKnight className={cn("h-6 w-6", resultColors.icon)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-lg truncate">
                  vs {game.opponent}
                </div>
                <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    game.playerColor === 'white' 
                      ? "bg-gray-100 text-gray-700" 
                      : "bg-gray-800 text-gray-100"
                  )}>
                    {game.playerColor === 'white' ? 'White' : 'Black'}
                  </span>
                  {game.timeClass && (
                    <span className="text-xs text-gray-400 capitalize">{game.timeClass}</span>
                  )}
                </div>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm",
              resultColors.bg,
              resultColors.border,
              "border"
            )}>
              <ResultIcon className={cn("h-4 w-4", resultColors.icon)} />
              <span className={resultColors.text}>{getResultText()}</span>
            </div>
          </div>

          {/* Game details */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{format(new Date(game.date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
              <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{formatTimeControl(game.timeControl)}</span>
              {timeClassLabel && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="font-medium text-gray-700">{timeClassLabel}</span>
                </>
              )}
            </div>
            {game.opponentRating && (
              <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                <TrendingUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span>Opponent Rating: <span className="font-semibold text-gray-900">{game.opponentRating}</span></span>
              </div>
            )}
            {game.opening && (
              <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                <Zap className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">
                  {game.openingEco && <span className="font-mono font-semibold">{game.openingEco}</span>} {game.opening}
                </span>
              </div>
            )}
          </div>

          {/* Footer with actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 px-4 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200",
                "transition-all duration-200 hover:scale-105"
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleView(e)
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Analyze
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 opacity-0 group-hover:opacity-100 transition-all duration-200",
                "text-red-500 hover:text-red-600 hover:bg-red-50"
              )}
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Game</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-gray-600">
            Are you sure you want to delete this game against <strong>{game.opponent}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default GameCard
