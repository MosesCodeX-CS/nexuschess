'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, SortDesc, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { GameCard } from './GameCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from '@/components/ui/use-toast'

interface GameListProps {
  userId?: string
  onGamesChange?: () => void
}

interface Game {
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

type SortOption = 'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc'
type FilterOption = 'all' | 'wins' | 'losses' | 'draws'
type TimeControlFilter = 'all' | 'bullet' | 'blitz' | 'rapid' | 'classical' | 'daily'

// Helper to normalize result
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

export function GameList({ userId, onGamesChange }: GameListProps) {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [allGames, setAllGames] = useState<Game[]>([]) // For stats calculation
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [timeControlFilter, setTimeControlFilter] = useState<TimeControlFilter>('all')
  const [totalGames, setTotalGames] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const gamesPerPage = 18

  useEffect(() => {
    fetchGames()
    fetchAllGames() // Fetch all games for stats
  }, [userId, sortBy, filterBy])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [timeControlFilter, filterBy, searchQuery])

  const fetchAllGames = async () => {
    try {
      // Get all games without limit for stats
      const response = await apiFetch('/api/games?limit=10000&sort=date-desc')
      if (response.ok) {
        const data = await response.json()
        setAllGames(data.games || [])
        console.log('Fetched all games for stats:', data.games?.length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch all games for stats:', error)
    }
  }

  const fetchGames = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        filter: filterBy,
        limit: '100', // Increase limit to get more games
      })

      const response = await apiFetch(`/api/games?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGames(data.games || [])
        setTotalGames(data.overallTotal || data.total || 0)
        console.log('Fetched games:', data.games?.length || 0, 'Total:', data.overallTotal || data.total)
      }
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await apiFetch('/api/games/sync', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const result = await response.json()
      
      toast({
        title: result.imported > 0 ? "Sync successful!" : "Already up to date",
        description: result.message,
      })

      await fetchGames()
      await fetchAllGames() // Refresh all games for stats
      onGamesChange?.()
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync games. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDeleteGame = (gameId: string) => {
    setGames(prev => prev.filter(g => g.id !== gameId))
    setAllGames(prev => prev.filter(g => g.id !== gameId)) // Also remove from allGames
    setTotalGames(prev => prev - 1)
    onGamesChange?.()
  }

  const handleViewGame = (gameId: string) => {
    router.push(`/games/${gameId}`)
  }

  // Filter games by search, time control, and result
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          game.opponent.toLowerCase().includes(query) ||
          game.opening?.toLowerCase().includes(query) ||
          game.openingEco?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Time control filter
      if (timeControlFilter !== 'all') {
        const gameTimeClass = game.timeClass?.toLowerCase() || ''
        if (gameTimeClass !== timeControlFilter) return false
      }

      // Result filter
      if (filterBy !== 'all') {
        const result = normalizeResult(game.result, game.playerColor)
        if (filterBy === 'wins' && result !== 'win') return false
        if (filterBy === 'losses' && result !== 'loss') return false
        if (filterBy === 'draws' && result !== 'draw') return false
      }

      return true
    })
  }, [games, searchQuery, timeControlFilter, filterBy])

  // Pagination - use totalGames for the count, not filteredGames.length
  const totalPages = Math.ceil(totalGames / gamesPerPage)
  const paginatedGames = useMemo(() => {
    const startIndex = (currentPage - 1) * gamesPerPage
    return filteredGames.slice(startIndex, startIndex + gamesPerPage)
  }, [filteredGames, currentPage])

  // Count functions - use allGames for stats
  const getWinCount = () => allGames.filter(g => normalizeResult(g.result, g.playerColor) === 'win').length
  const getLossCount = () => allGames.filter(g => normalizeResult(g.result, g.playerColor) === 'loss').length
  const getDrawCount = () => allGames.filter(g => normalizeResult(g.result, g.playerColor) === 'draw').length

  // Debug logging for draw games
  const drawGames = allGames.filter(g => normalizeResult(g.result, g.playerColor) === 'draw')
  console.log('Draw games debug:', {
    totalGames: allGames.length,
    drawCount: drawGames.length,
    drawGames: drawGames.slice(0, 5).map(g => ({
      opponent: g.opponent,
      rawResult: g.result,
      playerColor: g.playerColor,
      normalized: normalizeResult(g.result, g.playerColor)
    }))
  })

  const getTimeControlCount = (timeClass: TimeControlFilter) => {
    if (timeClass === 'all') return allGames.length
    return allGames.filter(g => g.timeClass?.toLowerCase() === timeClass).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stats-card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-700 mb-2">{allGames.length}</div>
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Total Games</div>
          </CardContent>
        </Card>
        <Card className="stats-card bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-green-700 mb-2">{getWinCount()}</div>
            <div className="text-sm font-semibold text-green-600 uppercase tracking-wide">Wins</div>
          </CardContent>
        </Card>
        <Card className="stats-card bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-red-700 mb-2">{getLossCount()}</div>
            <div className="text-sm font-semibold text-red-600 uppercase tracking-wide">Losses</div>
          </CardContent>
        </Card>
        <Card className="stats-card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-yellow-700 mb-2">{getDrawCount()}</div>
            <div className="text-sm font-semibold text-yellow-600 uppercase tracking-wide">Draws</div>
          </CardContent>
        </Card>
      </div>

      {/* Time Control Tabs */}
      <Tabs value={timeControlFilter} onValueChange={(v) => setTimeControlFilter(v as TimeControlFilter)} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-full min-w-max grid-cols-6">
            <TabsTrigger value="all" className="whitespace-nowrap">All ({getTimeControlCount('all')})</TabsTrigger>
            <TabsTrigger value="bullet" className="whitespace-nowrap">Bullet ({getTimeControlCount('bullet')})</TabsTrigger>
            <TabsTrigger value="blitz" className="whitespace-nowrap">Blitz ({getTimeControlCount('blitz')})</TabsTrigger>
            <TabsTrigger value="rapid" className="whitespace-nowrap">Rapid ({getTimeControlCount('rapid')})</TabsTrigger>
            <TabsTrigger value="classical" className="whitespace-nowrap">Classical ({getTimeControlCount('classical')})</TabsTrigger>
            <TabsTrigger value="daily" className="whitespace-nowrap">Daily ({getTimeControlCount('daily')})</TabsTrigger>
          </TabsList>
        </div>

        {/* All Tab Content */}
        <TabsContent value={timeControlFilter} className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search by opponent or opening..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Tabs value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="wins">Wins</TabsTrigger>
                  <TabsTrigger value="losses">Losses</TabsTrigger>
                  <TabsTrigger value="draws">Draws</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <SortDesc className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="border rounded px-2 py-1 text-sm bg-background"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="rating-desc">Highest Rating</option>
                  <option value="rating-asc">Lowest Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Games Grid */}
          {paginatedGames.length === 0 ? (
            <div className="text-center py-12">
              {totalGames === 0 ? (
                <>
                  <p className="text-muted-foreground mb-4">No games imported yet</p>
                  <p className="text-sm text-muted-foreground">
                    Import your games from Chess.com to start analyzing your play
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No games match your search</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onDelete={handleDeleteGame}
                    onView={handleViewGame}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * gamesPerPage + 1} to {Math.min(currentPage * gamesPerPage, totalGames)} of {totalGames} games
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          return page === 1 || 
                                 page === totalPages || 
                                 (page >= currentPage - 1 && page <= currentPage + 1)
                        })
                        .map((page, index, array) => {
                          // Add ellipsis
                          const prevPage = array[index - 1]
                          const showEllipsisBefore = prevPage && page - prevPage > 1
                          
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsisBefore && <span className="px-2">...</span>}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[2.5rem]"
                              >
                                {page}
                              </Button>
                            </div>
                          )
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GameList
