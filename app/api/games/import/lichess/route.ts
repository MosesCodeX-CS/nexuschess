import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getLichessGames } from '@/lib/api/lichess'

// Import Chess separately
let Chess: any
try {
  const chessModule = await import('chess.js')
  Chess = chessModule.Chess
} catch {
  Chess = class {}
}

export async function POST(request: NextRequest) {
  try {
    const tokenStr = request.headers.get('authorization')?.replace('Bearer ', '') || 
                     request.cookies.get('nexuschess_token')?.value
    
    if (!tokenStr) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = verifyToken(tokenStr)
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { username, max = 50 } = await request.json() as {
      username: string
      max?: number
    }

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Fetch games from Lichess
    const lichessGames = await getLichessGames(username, max)

    if (lichessGames.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: 'No games found'
      })
    }

    let imported = 0
    let failed = 0

    for (const game of lichessGames) {
      try {
        if (!game.pgn || !game.moves) continue

        // Determine player's color
        const isWhite = game.players.white.user?.name.toLowerCase() === username.toLowerCase()

        // Parse PGN
        const chess = new Chess()
        chess.loadPgn(game.pgn || game.moves)

        // Extract opening info
        const headers = (game.pgn || game.moves).match(/\[(\w+)\s+"([^"]*)"\]/g) || []
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

        // Determine result
        let result = '*'
        if (game.status === 'mate') {
          result = game.winner === 'white' ? '1-0' : '0-1'
        } else if (game.status === 'draw' || game.status === 'stalemate') {
          result = '1/2-1/2'
        }

        // Map Lichess speed to time class
        const timeClassMap: Record<string, string> = {
          'bullet': 'bullet',
          'blitz': 'blitz',
          'rapid': 'rapid',
          'classical': 'classical',
        }
        const timeClass = timeClassMap[game.perf] || game.speed

        // Format time control
        let timeControl = game.perf || game.speed
        if (game.clock) {
          timeControl = `${Math.floor(game.clock.initial / 60)}+${game.clock.increment}`
        }

        // Get opponent info
        const opponent = isWhite 
          ? game.players.black.user?.name || 'Anonymous'
          : game.players.white.user?.name || 'Anonymous'
        
        const opponentRating = isWhite
          ? game.players.black.rating
          : game.players.white.rating

        // Create game record
        await prisma.game.create({
          data: {
            userId: token.userId,
            pgn: game.pgn || game.moves,
            result,
            playerColor: isWhite ? 'white' : 'black',
            opponent,
            opponentRating: opponentRating || null,
            timeControl,
            timeClass,
            date: new Date(game.createdAt),
            opening,
            openingEco,
          },
        })

        imported++
      } catch (error) {
        console.error('Failed to import Lichess game:', error)
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
    console.error('Failed to import Lichess games:', error)
    return NextResponse.json(
      { error: 'Failed to import games' },
      { status: 500 }
    )
  }
}

