'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getChessComGames, getChessComGamesMultiple, type ChessComGame } from '@/lib/api/chess-com'
import { apiFetch } from '@/lib/api/fetch'

interface GameImportDialogProps {
  chessComUsername?: string
  onImportComplete?: () => void
  trigger?: React.ReactNode
}

interface ImportableGame {
  id: string
  url: string
  white: string
  black: string
  date: string
  result: string
  timeControl: string
  selected: boolean
}

export function GameImportDialog({
  chessComUsername,
  onImportComplete,
  trigger,
}: GameImportDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState(chessComUsername || '')
  const [isLoading, setIsLoading] = useState(false)
  const [games, setGames] = useState<ImportableGame[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedCount, setSelectedCount] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const [monthsBack, setMonthsBack] = useState(12)

  // Fetch games when username changes or dialog opens with username
  const fetchGames = async () => {
    if (!username.trim()) {
      setError('Please enter a Chess.com username')
      return
    }

    setIsLoading(true)
    setError(null)
    setGames([])
    setImportResult(null)

    try {
      const fetchedGames = await getChessComGamesMultiple(username, monthsBack)
      
      if (fetchedGames.length === 0) {
        setError('No games found. Try a different username or increase the time range.')
        setIsLoading(false)
        return
      }

      const importableGames: ImportableGame[] = fetchedGames.map((game, index) => ({
        id: game.uuid || `game-${index}`,
        url: game.url,
        white: game.white.username,
        black: game.black.username,
        date: new Date(game.end_time * 1000).toLocaleDateString(),
        result: game.white.result === 'win' ? '1-0' : game.black.result === 'win' ? '0-1' : '1/2-1/2',
        timeControl: game.time_control,
        selected: false,
      }))

      setGames(importableGames)
    } catch (err) {
      setError('Failed to fetch games. Please check the username and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGameSelection = (gameId: string) => {
    setGames(prev =>
      prev.map(game =>
        game.id === gameId ? { ...game, selected: !game.selected } : game
      )
    )
    setSelectedCount(prev => {
      const game = games.find(g => g.id === gameId)
      return game?.selected ? prev - 1 : prev + 1
    })
  }

  const toggleAll = () => {
    const allSelected = games.length > 0 && games.every(g => g.selected)
    setGames(prev => prev.map(g => ({ ...g, selected: !allSelected })))
    setSelectedCount(allSelected ? 0 : games.length)
  }

  const handleImport = async () => {
    const selectedGames = games.filter(g => g.selected)
    if (selectedGames.length === 0) {
      setError('Please select at least one game to import')
      return
    }

    setImporting(true)
    setError(null)

    try {
      // Get the full game data for selected games
      const fullGames = await getChessComGamesMultiple(username, monthsBack)
      const selectedFullGames = fullGames.filter(g => selectedGames.some(sg => sg.url === g.url))

      const response = await apiFetch('/api/games/import', {
        method: 'POST',
        body: JSON.stringify({
          games: selectedFullGames,
          username,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to import games')
      }

      const result = await response.json()
      setImportResult({ success: result.imported, failed: result.failed || 0 })
      
      onImportComplete?.()
      
      // Refresh the page data
      router.refresh()
    } catch (err) {
      setError('Failed to import games. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when closing
      setGames([])
      setError(null)
      setImportResult(null)
      setSelectedCount(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Import Games
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Games from Chess.com</DialogTitle>
          <DialogDescription>
            Enter a Chess.com username to fetch and import their recent games.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Username Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="chesscom-username">Chess.com Username</Label>
                <Input
                  id="chesscom-username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="pt-6">
                <Button onClick={fetchGames} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Fetch Games</span>
                </Button>
              </div>
            </div>
            
            {/* Month Range Selector */}
            <div className="flex items-center gap-2">
              <Label htmlFor="months-back">Time Range:</Label>
              <select
                id="months-back"
                className="border rounded px-2 py-1 text-sm"
                value={monthsBack}
                onChange={(e) => setMonthsBack(Number(e.target.value))}
              >
                <option value={1}>Last Month</option>
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last Year</option>
                <option value={24}>Last 2 Years</option>
                <option value={36}>Last 3 Years</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span>
                Successfully imported {importResult.success} game{importResult.success !== 1 ? 's' : ''}
                {importResult.failed > 0 && ` (${importResult.failed} failed)`}
              </span>
            </div>
          )}

          {/* Games List */}
          {games.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">
                  Games ({games.length})
                  {selectedCount > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({selectedCount} selected)
                    </span>
                  )}
                </Label>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {games.length > 0 && games.every(g => g.selected) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {games.map((game) => (
                  <label
                    key={game.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={game.selected}
                      onChange={() => toggleGameSelection(game.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-medium">{game.white}</span>
                        <span className="text-muted-foreground ml-1">(W)</span>
                      </div>
                      <div className="text-center">
                        <span className="font-medium">{game.result}</span>
                      </div>
                      <div>
                        <span className="font-medium">{game.black}</span>
                        <span className="text-muted-foreground ml-1">(B)</span>
                      </div>
                      <div className="text-right text-muted-foreground">
                        {game.date}
                        <span className="ml-2">{game.timeControl}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Import Button */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedCount === 0 || importing}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import {selectedCount} Game{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <span>Fetching games from Chess.com...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && games.length === 0 && !error && (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Enter a Chess.com username to fetch their games</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default GameImportDialog

