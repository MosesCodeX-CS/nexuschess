import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getChessComStats } from '@/lib/api/chess-com'

export async function GET(request: NextRequest) {
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

    // Get user's Chess.com username
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { chesscomUsername: true }
    })

    if (!user?.chesscomUsername) {
      return NextResponse.json(
        { error: 'Chess.com username not linked' },
        { status: 400 }
      )
    }

    // Fetch stats from Chess.com
    const stats = await getChessComStats(user.chesscomUsername)

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Failed to fetch Chess.com stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

