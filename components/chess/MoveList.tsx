'use client'

import { Trophy, TrendingUp, AlertTriangle, X } from 'lucide-react'

interface Move {
  moveNumber: number
  white?: string
  black?: string
}

interface Mistake {
  moveNumber: number
  playedMove: string
  severity: string
}

interface MoveListProps {
  moves: Move[]
  mistakes?: Mistake[]
  currentMove?: number
  onMoveClick?: (moveIndex: number) => void
}

const getMoveType = (moveNumber: number, move: string, mistakes: Mistake[]) => {
  const mistake = mistakes.find(m => m.moveNumber === moveNumber && m.playedMove === move)
  
  if (mistake) {
    switch (mistake.severity) {
      case 'blunder':
        return { icon: X, color: 'text-red-500', bgColor: 'bg-red-50', label: 'Blunder' }
      case 'mistake':
        return { icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-50', label: 'Mistake' }
      case 'inaccuracy':
        return { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-50', label: 'Inaccuracy' }
      default:
        return null
    }
  }
  
  // Could add logic for brilliant/great/best moves here if available
  return null
}

export default function MoveList({ moves, mistakes = [], currentMove = -1, onMoveClick }: MoveListProps) {
  return (
    <div className="space-y-1 max-h-96 overflow-y-auto">
      {moves.length === 0 ? (
        <p className="text-gray-500 text-sm">No moves yet</p>
      ) : (
        moves.map((move, index) => {
          const whiteMoveType = move.white ? getMoveType(move.moveNumber, move.white, mistakes) : null
          const blackMoveType = move.black ? getMoveType(move.moveNumber, move.black, mistakes) : null
          
          return (
            <div key={index} className="border-b border-gray-100 pb-1">
              <div className="flex items-center">
                {/* Move Number */}
                <span className="text-xs font-semibold text-gray-500 w-8">
                  {move.moveNumber}.
                </span>
                
                {/* White Move */}
                <div className="flex-1">
                  {move.white && (
                    <div
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors text-sm
                        ${currentMove === index * 2 
                          ? 'bg-blue-100 text-blue-900 font-semibold' 
                          : currentMove > index * 2
                          ? 'text-gray-700 hover:bg-gray-50'
                          : 'text-gray-400 hover:bg-gray-50'
                        }
                        ${whiteMoveType ? whiteMoveType.bgColor : ''}
                      `}
                      onClick={() => onMoveClick?.(index * 2)}
                    >
                      {whiteMoveType && (
                        <whiteMoveType.icon className={`w-3 h-3 ${whiteMoveType.color}`} />
                      )}
                      <span className={whiteMoveType ? whiteMoveType.color : ''}>
                        {move.white}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Black Move */}
                <div className="flex-1">
                  {move.black && (
                    <div
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors text-sm
                        ${currentMove === index * 2 + 1 
                          ? 'bg-blue-100 text-blue-900 font-semibold' 
                          : currentMove > index * 2 + 1
                          ? 'text-gray-700 hover:bg-gray-50'
                          : 'text-gray-400 hover:bg-gray-50'
                        }
                        ${blackMoveType ? blackMoveType.bgColor : ''}
                      `}
                      onClick={() => onMoveClick?.(index * 2 + 1)}
                    >
                      {blackMoveType && (
                        <blackMoveType.icon className={`w-3 h-3 ${blackMoveType.color}`} />
                      )}
                      <span className={blackMoveType ? blackMoveType.color : ''}>
                        {move.black}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
