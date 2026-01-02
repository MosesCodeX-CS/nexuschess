import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'date-desc'
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause based on filter
    let whereClause: any = { userId: token.userId }

    // For filtering by result, we need to consider player's perspective
    if (filter !== 'all') {
      if (filter === 'wins') {
        // Wins: Player won the game
        whereClause.OR = [
          { AND: [{ result: '1-0' }, { playerColor: 'white' }] },
          { AND: [{ result: '0-1' }, { playerColor: 'black' }] },
          { result: 'win' }, // Chess.com format - player won
        ]
      } else if (filter === 'losses') {
        // Losses: Player lost the game
        whereClause.OR = [
          { AND: [{ result: '1-0' }, { playerColor: 'black' }] },
          { AND: [{ result: '0-1' }, { playerColor: 'white' }] },
          { result: 'loss' }, // Chess.com format - player lost
          { result: 'checkmated' }, // Player was checkmated
          { result: 'timeout' }, // Player timed out
          { result: 'resigned' }, // Player resigned
          { result: 'insufficient' }, // Player had insufficient material
          { result: 'stalemate' }, // Player was stalemated
        ]
      } else if (filter === 'draws') {
        // Draws: Result is '1/2-1/2' or draw formats
        whereClause.OR = [
          { result: '1/2-1/2' },
          { result: 'draw' },
          { result: 'agreed' },
          { result: 'repetition' },
          { result: 'threefold' },
          { result: 'fifty' },
          { result: 'stalemate' },
        ]
      }
    }

    // Build order by based on sort
    let orderBy: any = { date: 'desc' }
    if (sort === 'date-asc') orderBy = { date: 'asc' }
    if (sort === 'rating-desc') orderBy = { opponentRating: 'desc' }
    if (sort === 'rating-asc') orderBy = { opponentRating: 'asc' }

    // Fetch games
    const [games, total, overallTotal] = await Promise.all([
      prisma.game.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          pgn: true,
          result: true,
          playerColor: true,
          opponent: true,
          opponentRating: true,
          timeControl: true,
          timeClass: true,
          date: true,
          opening: true,
          openingEco: true,
          accuracy: true,
        },
      }),
      prisma.game.count({ where: whereClause }),
      prisma.game.count({ where: { userId: token.userId } }), // Overall total for stats
    ])

    return NextResponse.json({
      games: games.map(game => ({
        ...game,
        date: game.date.toISOString(),
      })),
      total,
      overallTotal, // Add overall total for stats
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

