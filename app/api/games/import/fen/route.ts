import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

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

    const { fen, pgn, opponent, timeControl, timeClass } = await request.json() as {
      fen?: string
      pgn?: string
      opponent?: string
      timeControl?: string
      timeClass?: string
    }

    if (!fen && !pgn) {
      return NextResponse.json(
        { error: 'FEN or PGN is required' },
        { status: 400 }
      )
    }

    try {
      const chess = new Chess()
      
      if (pgn) {
        chess.loadPgn(pgn)
      } else if (fen) {
        chess.load(fen)
      }

      // Extract opening info if PGN provided
      let openingEco: string | null = null
      let opening: string | null = null
      
      if (pgn) {
        const headers = pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) || []
        for (const header of headers) {
          if (header.startsWith('[ECO')) {
            openingEco = header.match(/"([^"]*)"/)?.[1] || null
          }
          if (header.startsWith('[Opening')) {
            opening = header.match(/"([^"]*)"/)?.[1] || null
          }
        }
      }

      // Determine result
      let result = '*'
      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          result = chess.turn() === 'w' ? '0-1' : '1-0'
        } else if (chess.isDraw() || chess.isStalemate()) {
          result = '1/2-1/2'
        }
      }

      // Determine player color (default to white)
      const playerColor = chess.turn() === 'w' ? 'black' : 'white'

      // Create game record
      const game = await prisma.game.create({
        data: {
          userId: token.userId,
          pgn: pgn || chess.pgn(),
          result,
          playerColor,
          opponent: opponent || 'Manual Import',
          timeControl: timeControl || 'Unrated',
          timeClass: timeClass || null,
          date: new Date(),
          opening,
          openingEco,
        },
      })

      return NextResponse.json({
        success: true,
        gameId: game.id,
        message: 'Game imported successfully',
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid FEN or PGN format' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to import FEN/PGN:', error)
    return NextResponse.json(
      { error: 'Failed to import game' },
      { status: 500 }
    )
  }
}

