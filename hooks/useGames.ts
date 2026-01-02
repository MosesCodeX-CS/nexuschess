import { create } from 'zustand'
import useSWR from 'swr'
import { apiFetch } from '@/lib/api/fetch'

const fetcher = (url: string) => apiFetch(url).then(res => res.json())

interface Game {
  id: string
  pgn: string
  result: string
  playerColor: string
  opponent: string
  opponentRating?: number | null
  timeControl: string
  date: Date
  opening?: string | null
  openingEco?: string | null
  accuracy?: number | null
}

interface GamesState {
  games: Game[]
  isLoading: boolean
  error: string | null
  total: number
  
  // Actions
  fetchGames: (options?: { sort?: string; filter?: string }) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  importGames: (games: any[], username: string) => Promise<{ success: number; failed: number }>
  refresh: () => void
}

export const useGames = create<GamesState>((set, get) => ({
  games: [],
  isLoading: false,
  error: null,
  total: 0,

  fetchGames: async (options = {}) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (options.sort) params.set('sort', options.sort)
      if (options.filter) params.set('filter', options.filter)

      const response = await apiFetch(`/api/games?${params}`)
      if (!response.ok) throw new Error('Failed to fetch games')
      
      const data = await response.json()
      set({
        games: data.games,
        total: data.total,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      })
    }
  },

  deleteGame: async (id: string) => {
    try {
      const response = await apiFetch(`/api/games/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete game')
      
      set((state) => ({
        games: state.games.filter(g => g.id !== id),
        total: state.total - 1,
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  importGames: async (games: any[], username: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiFetch('/api/games/import', {
        method: 'POST',
        body: JSON.stringify({ games, username }),
      })
      
      if (!response.ok) throw new Error('Failed to import games')
      
      const result = await response.json()
      
      // Refresh the games list
      await get().fetchGames()
      
      set({ isLoading: false })
      return result
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      })
      throw error
    }
  },

  refresh: () => {
    get().fetchGames()
  },
}))

// SWR hook for single game
export function useGame(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/games/${id}` : null,
    fetcher
  )

  return {
    game: data?.game,
    isLoading,
    error,
    mutate,
  }
}

// SWR hook for games list
export function useGamesList(options?: { sort?: string; filter?: string }) {
  const params = new URLSearchParams()
  if (options?.sort) params.set('sort', options.sort)
  if (options?.filter) params.set('filter', options.filter)

  const { data, error, isLoading, mutate } = useSWR(
    `/api/games?${params}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
    }
  )

  return {
    games: data?.games || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
  }
}

export default useGames

