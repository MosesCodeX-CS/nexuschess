'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface PgnViewerProps {
  pgn: string
  headers?: {
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
  }
  showHeaders?: boolean
  showMoveNumbers?: boolean
  highlightMoves?: number[]
  currentMove?: number
  onMoveClick?: (moveNumber: number) => void
}

export function PgnViewer({
  pgn,
  headers,
  showHeaders = true,
  showMoveNumbers = true,
  highlightMoves = [],
  currentMove,
  onMoveClick,
}: PgnViewerProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  const parsedMoves = useMemo(() => {
    const lines = pgn.split('\n')
    const moveSection = lines.slice(
      lines.findIndex(line => !line.startsWith('[')) || 0
    ).join(' ')

    // Remove comments and variations for clean display
    const cleanMoves = moveSection
      .replace(/\{[^}]*\}/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\$\d+/g, '')
      .trim()

    const tokens = cleanMoves.split(/\s+/)
    const moves: { number: number; white?: string; black?: string }[] = []
    let currentNumber = 1
    let expectingWhite = true

    for (const token of tokens) {
      // Skip result tokens and move numbers
      if (['1-0', '0-1', '1/2-1/2', '*', ''].includes(token)) continue
      if (/^\d+\.$/.test(token)) continue

      if (expectingWhite) {
        moves.push({ number: currentNumber, white: token })
        expectingWhite = false
      } else {
        moves[moves.length - 1].black = token
        currentNumber++
        expectingWhite = true
      }
    }

    return moves
  }, [pgn])

  const getMoveStyle = (moveNumber: number, color: 'white' | 'black') => {
    const index = (moveNumber - 1) * 2 + (color === 'white' ? 0 : 1)
    const isCurrentMove = currentMove === index
    const isHighlighted = highlightMoves.includes(index)

    if (isCurrentMove) {
      return 'bg-blue-100 dark:bg-blue-900 font-semibold'
    }
    if (isHighlighted) {
      return 'bg-yellow-100 dark:bg-yellow-900'
    }
    return ''
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pgn)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="font-mono text-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <CardTitle className="text-base">PGN</CardTitle>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  {copied ? 'Copied!' : 'Copy PGN'}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardHeader>
      <CardContent>
        {/* Headers */}
        {showHeaders && headers && (
          <div className="border-b pb-3 mb-3 space-y-1 text-xs">
            {headers.Event && (
              <div>
                <span className="text-muted-foreground">[Event </span>
                <span className="text-foreground">"{headers.Event}"</span>
                <span className="text-muted-foreground">]</span>
              </div>
            )}
            {headers.White && (
              <div>
                <span className="text-muted-foreground">[White </span>
                <span className="text-foreground">"{headers.White}"</span>
                {headers.WhiteElo && <span className="text-muted-foreground"> ({headers.WhiteElo})</span>}
                <span className="text-muted-foreground">]</span>
              </div>
            )}
            {headers.Black && (
              <div>
                <span className="text-muted-foreground">[Black </span>
                <span className="text-foreground">"{headers.Black}"</span>
                {headers.BlackElo && <span className="text-muted-foreground"> ({headers.BlackElo})</span>}
                <span className="text-muted-foreground">]</span>
              </div>
            )}
            {headers.Result && (
              <div>
                <span className="text-muted-foreground">[Result </span>
                <span className="text-foreground">"{headers.Result}"</span>
                <span className="text-muted-foreground">]</span>
              </div>
            )}
            {headers.Opening && (
              <div>
                <span className="text-muted-foreground">[Opening </span>
                <span className="text-foreground">"{headers.Opening}"</span>
                <span className="text-muted-foreground">]</span>
              </div>
            )}
            {headers.ECO && (
              <div>
                <span className="text-muted-foreground">[ECO </span>
                <span className="text-foreground">"{headers.ECO}"</span>
                <span className="text-muted-foreground">]</span>
              </div>
            )}
          </div>
        )}

        {/* Moves */}
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {parsedMoves.map((move, index) => (
            <div key={index} className="grid grid-cols-[3rem_1fr_1fr] gap-2">
              {/* Move Number */}
              {showMoveNumbers && move.white && (
                <span className="text-muted-foreground text-xs text-right">
                  {move.number}.
                </span>
              )}
              {!showMoveNumbers && move.white && (
                <span className="text-muted-foreground text-xs text-right">
                  {move.number}.
                </span>
              )}
              
              {/* White Move */}
              {move.white && (
                <button
                  className={`text-left px-2 py-1 rounded ${getMoveStyle(move.number, 'white')}`}
                  onClick={() => onMoveClick?.((move.number - 1) * 2)}
                >
                  {move.white}
                </button>
              )}
              
              {/* Black Move */}
              {move.black && (
                <button
                  className={`text-left px-2 py-1 rounded ${getMoveStyle(move.number, 'black')}`}
                  onClick={() => onMoveClick?.((move.number - 1) * 2 + 1)}
                >
                  {move.black}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Result */}
        {headers?.Result && (
          <div className="mt-3 pt-3 border-t text-center">
            <span className="font-semibold">{headers.Result}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PgnViewer

