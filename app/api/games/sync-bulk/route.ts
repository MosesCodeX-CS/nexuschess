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

    // Get request body for months back parameter
    const body = await request.json().catch(() => ({}))
    const monthsBack = body.monthsBack || 24 // Default to 24 months (2 years)

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

    // Fetch games for specified period
    console.log(`Fetching games for ${user.chesscomUsername} - last ${monthsBack} months`)
    const allGames = await getChessComGamesMultiple(user.chesscomUsername, monthsBack)
    console.log(`Found ${allGames.length} games from Chess.com`)

    if (allGames.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: `No games found in the last ${monthsBack} months`
      })
    }

    // Get existing game IDs to filter out
    console.log('Checking for existing games...')
    const existingGames = await prisma.game.findMany({
      where: {
        userId: token.userId,
        chesscomId: {
          in: allGames.map(g => g.uuid)
        }
      },
      select: { chesscomId: true }
    })

    const existingIds = new Set(existingGames.map(g => g.chesscomId).filter(Boolean))
    console.log(`Found ${existingIds.size} existing games`)

    // Filter out games that already exist
    const newGames = allGames.filter(g => !existingIds.has(g.uuid))
    console.log(`Need to import ${newGames.length} new games`)

    if (newGames.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: `All games from the last ${monthsBack} months are already synced`
      })
    }

    let imported = 0
    let failed = 0
    const batchSize = 50 // Process in batches to avoid overwhelming the database
    const totalBatches = Math.ceil(newGames.length / batchSize)

    for (let i = 0; i < totalBatches; i++) {
      const batch = newGames.slice(i * batchSize, (i + 1) * batchSize)
      
      for (const gameData of batch) {
        try {
          // Determine player's color
          const isWhite = gameData.white.username.toLowerCase() === user.chesscomUsername.toLowerCase()
          
          // Parse PGN to extract opening info (with error handling)
          let openingEco: string | null = null
          let opening: string | null = null
        
          try {
            const chess = new Chess()
            chess.loadPgn(gameData.pgn)
            
            // Try to get ECO and opening name from headers
            const headers = gameData.pgn.match(/\[(\w+)\s+"([^"]*)"\]/g) || []
            
            for (const header of headers) {
              if (header.startsWith('[ECO')) {
                openingEco = header.match(/"([^"]*)"/)?.[1] || null
              }
              if (header.startsWith('[Opening')) {
                opening = header.match(/"([^"]*)"/)?.[1] || null
              }
            }
          } catch (pgnError) {
            console.warn('Failed to parse PGN for opening extraction:', pgnError instanceof Error ? pgnError.message : 'Unknown error')
            // Continue without opening info - don't fail the entire import
          }

          // Calculate accuracy
          let accuracy: number | null = null
          if (gameData.accuracies) {
            accuracy = isWhite ? gameData.accuracies.white : gameData.accuracies.black
          }

          // Create game record
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
          console.error('Game data:', {
            uuid: gameData.uuid,
            white: gameData.white.username,
            black: gameData.black.username,
            time_control: gameData.time_control,
            time_class: gameData.time_class,
            end_time: gameData.end_time
          })
          failed++
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      failed,
      totalFound: allGames.length,
      alreadyExisted: existingIds.size,
      message: `Successfully synced ${imported} new game${imported !== 1 ? 's' : ''} from the last ${monthsBack} months${failed > 0 ? `, ${failed} failed` : ''}`,
    })
  } catch (error) {
    console.error('Failed to sync games:', error)
    return NextResponse.json(
      { error: 'Failed to sync games' },
      { status: 500 }
    )
  }
}
