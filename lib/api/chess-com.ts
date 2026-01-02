const CHESS_COM_API_BASE = 'https://api.chess.com/pub'

export interface ChessComPlayer {
  username: string
  player_id: number
  url: string
  name?: string
  avatar?: string
  followers?: number
  country?: string
  status?: string
}

export interface ChessComGame {
  url: string
  pgn: string
  time_control: string
  end_time: number
  rated: boolean
  accuracies?: {
    white: number
    black: number
  }
  tcn?: string
  uuid: string
  initial_setup?: string
  fen?: string
  time_class: string
  rules: string
  white: {
    rating: number
    result: string
    username: string
  }
  black: {
    rating: number
    result: string
    username: string
  }
}

export async function verifyChessComUser(username: string): Promise<boolean> {
  try {
    const response = await fetch(`${CHESS_COM_API_BASE}/player/${username}`)
    return response.ok
  } catch {
    return false
  }
}

export async function getChessComPlayer(username: string): Promise<ChessComPlayer | null> {
  try {
    const response = await fetch(`${CHESS_COM_API_BASE}/player/${username}`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function getChessComGames(
  username: string,
  year: number,
  month: number
): Promise<ChessComGame[]> {
  try {
    const monthStr = month.toString().padStart(2, '0')
    const response = await fetch(
      `${CHESS_COM_API_BASE}/player/${username}/games/${year}/${monthStr}`
    )
    if (!response.ok) return []
    const data = await response.json()
    return data.games || []
  } catch {
    return []
  }
}

export async function getChessComGamesMultiple(
  username: string,
  monthsBack: number = 12
): Promise<ChessComGame[]> {
  const allGames: ChessComGame[] = []
  const currentDate = new Date()
  
  for (let i = 0; i < monthsBack; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    
    try {
      const games = await getChessComGames(username, year, month)
      allGames.push(...games)
    } catch (error) {
      console.error(`Failed to fetch games for ${year}-${month}:`, error)
    }
  }
  
  return allGames
}

export async function getCurrentMonthGames(username: string): Promise<ChessComGame[]> {
  const now = new Date()
  return getChessComGames(username, now.getFullYear(), now.getMonth() + 1)
}

export interface ChessComStats {
  chess_daily?: {
    last: { rating: number; date: number }
    record: { win: number; loss: number; draw: number }
  }
  chess_rapid?: {
    last: { rating: number; date: number }
    record: { win: number; loss: number; draw: number }
  }
  chess_blitz?: {
    last: { rating: number; date: number }
    record: { win: number; loss: number; draw: number }
  }
  chess_bullet?: {
    last: { rating: number; date: number }
    record: { win: number; loss: number; draw: number }
  }
}

export async function getChessComStats(username: string): Promise<ChessComStats | null> {
  try {
    const response = await fetch(`${CHESS_COM_API_BASE}/player/${username}/stats`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}