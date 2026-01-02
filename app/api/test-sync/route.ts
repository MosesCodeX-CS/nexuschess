import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get user from token
    const tokenStr = request.headers.get('authorization')?.replace('Bearer ', '') || 
                     request.cookies.get('nexuschess_token')?.value
    
    if (!tokenStr) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 })
    }

    const token = verifyToken(tokenStr)
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { chesscomUsername: true, username: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Count existing games
    const gameCount = await prisma.game.count({
      where: { userId: token.userId }
    })

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        chesscomUsername: user.chesscomUsername
      },
      existingGames: gameCount,
      message: 'Test endpoint working'
    })
  } catch (error) {
    console.error('Test sync error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
