import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getChessComGamesMultiple } from '@/lib/api/chess-com'

// Import Chess separately to avoid issues
let Chess: any
try {
  const chessModule = await import('chess.js')
  Chess = chessModule.Chess
} catch {
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

    // Get user's Chess.com username
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { chesscomUsername: true }
    })

    if (!user?.chesscomUsername) {
      return NextResponse.json(
        { error: 'Chess.com username not linked to account' },
        { status: 400 }
      )
    }

    // Fetch recent games (last 2 months for quick sync)
    const recentGames = await getChessComGamesMultiple(user.chesscomUsername, 2)

    if (recentGames.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: 'No new games found'
      })
    }

    // Get existing game IDs to filter out
    const existingGames = await prisma.game.findMany({
      where: {
        userId: token.userId,
        chesscomId: {
          in: recentGames.map(g => g.uuid)
        }
      },
      select: { chesscomId: true }
    })

    const existingIds = new Set(existingGames.map(g => g.chesscomId).filter(Boolean))

    // Filter out games that already exist
    const newGames = recentGames.filter(g => !existingIds.has(g.uuid))

    if (newGames.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: 'All games are already synced'
      })
    }

    let imported = 0
    let failed = 0

    for (const gameData of newGames) {
      try {
        // Determine player's color
        const isWhite = gameData.white.username.toLowerCase() === user.chesscomUsername.toLowerCase()
        
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

        // Create game record (no update since we filtered out existing games)
        await prisma.game.create({
          data: {
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
      message: `Successfully synced ${imported} new game${imported !== 1 ? 's' : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
    })
  } catch (error) {
    console.error('Failed to sync games:', error)
    return NextResponse.json(
      { error: 'Failed to sync games' },
      { status: 500 }
    )
  }
}

