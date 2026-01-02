const LICHESS_API_BASE = 'https://lichess.org/api'

export interface LichessGame {
  id: string
  rated: boolean
  variant: string
  speed: string
  perf: string
  createdAt: number
  lastMoveAt: number
  status: string
  players: {
    white: {
      user?: {
        name: string
        rating: number
      }
      rating?: number
      ratingDiff?: number
    }
    black: {
      user?: {
        name: string
        rating: number
      }
      rating?: number
      ratingDiff?: number
    }
  }
  winner?: 'white' | 'black'
  moves: string
  pgn?: string
  clock?: {
    initial: number
    increment: number
  }
}

export interface LichessUser {
  id: string
  username: string
  perfs: {
    classical?: { rating: number; games: number }
    rapid?: { rating: number; games: number }
    blitz?: { rating: number; games: number }
    bullet?: { rating: number; games: number }
    ultraBullet?: { rating: number; games: number }
  }
  createdAt: number
  profile?: {
    country?: string
    location?: string
    bio?: string
    firstName?: string
    lastName?: string
    links?: string
  }
}

export async function getLichessUser(username: string): Promise<LichessUser | null> {
  try {
    const response = await fetch(`${LICHESS_API_BASE}/user/${username}`, {
      headers: {
        'Accept': 'application/json'
      }
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function getLichessGames(
  username: string,
  max: number = 50
): Promise<LichessGame[]> {
  try {
    const response = await fetch(
      `${LICHESS_API_BASE}/games/user/${username}?max=${max}&pgnInJson=true`,
      {
        headers: {
          'Accept': 'application/x-ndjson'
        }
      }
    )
    if (!response.ok) return []
    
    const text = await response.text()
    const lines = text.trim().split('\n').filter(Boolean)
    return lines.map(line => JSON.parse(line))
  } catch {
    return []
  }
}

export async function verifyLichessUser(username: string): Promise<boolean> {
  try {
    const user = await getLichessUser(username)
    return user !== null
  } catch {
    return false
  }
}

