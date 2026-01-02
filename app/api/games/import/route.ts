import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

// Import Chess separately to avoid issues
let Chess: any
try {
  const chessModule = await import('chess.js')
  Chess = chessModule.Chess
} catch {
  // Fallback
  Chess = class {}
}

interface ChessComGameData {
  url: string
  pgn: string
  time_control: string
  end_time: number
  rated: boolean
  accuracies?: { white: number; black: number }
  uuid: string
  fen?: string
  time_class: string
  rules: string
  white: { rating: number; result: string; username: string }
  black: { rating: number; result: string; username: string }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const tokenStr = request.headers.get('authorization')?.replace('Bearer ', '') || 
                     request.cookies.get('nexuschess_token')?.value
    
    if (!tokenStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = verifyToken(tokenStr)
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { games, username } = await request.json() as {
      games: ChessComGameData[]
      username: string
    }

    if (!games || !Array.isArray(games) || games.length === 0) {
      return NextResponse.json(
        { error: 'No games provided' },
        { status: 400 }
      )
    }

    let imported = 0
    let failed = 0

    for (const gameData of games) {
      try {
        // Determine player's color
        const isWhite = gameData.white.username.toLowerCase() === username.toLowerCase()
        
        // Parse PGN to extract opening info
        const chess = new Chess()
        chess.loadPgn(gameData.pgn)
        
        // Try to get ECO and opening name from headers
        const headers = gameData.pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) || []
        let openingEco: string | null = null
        let opening: string | null = null
        
        for (const header of headers) {
          if (header.startsWith('[ECO')) {
            openingEco = header.match(/"([^"]*)"/)?.[1] || null
          }
          if (header.startsWith('[Opening')) {
            opening = header.match(/"([^"]*)"/)?.[1] || null
          }
        }

        // Calculate accuracy
        let accuracy: number | null = null
        if (gameData.accuracies) {
          accuracy = isWhite ? gameData.accuracies.white : gameData.accuracies.black
        }

        // Create or update game record
        await prisma.game.upsert({
          where: {
            chesscomId: gameData.uuid,
            userId: token.userId,
          },
          update: {
            pgn: gameData.pgn,
            result: isWhite ? gameData.white.result : gameData.black.result,
            playerColor: isWhite ? 'white' : 'black',
            opponent: isWhite ? gameData.black.username : gameData.white.username,
            opponentRating: isWhite ? gameData.black.rating : gameData.white.rating,
            timeControl: gameData.time_control,
            timeClass: gameData.time_class,
            date: new Date(gameData.end_time * 1000),
            opening,
            openingEco,
            accuracy,
          },
          create: {
            userId: token.userId,
            pgn: gameData.pgn,
            result: isWhite ? gameData.white.result : gameData.black.result,
            playerColor: isWhite ? 'white' : 'black',
            opponent: isWhite ? gameData.black.username : gameData.white.username,
            opponentRating: isWhite ? gameData.black.rating : gameData.white.rating,
            timeControl: gameData.time_control,
            timeClass: gameData.time_class,
            date: new Date(gameData.end_time * 1000),
            chesscomId: gameData.uuid,
            opening,
            openingEco,
            accuracy,
          },
        })

        imported++
      } catch (error) {
        console.error('Failed to import game:', error)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      failed,
      message: `Successfully imported ${imported} game${imported !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
    })
  } catch (error) {
    console.error('Failed to import games:', error)
    return NextResponse.json(
      { error: 'Failed to import games' },
      { status: 500 }
    )
  }
}

