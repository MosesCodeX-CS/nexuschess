import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get token from Authorization header or cookie (consistent with other routes)
    const authHeader = request.headers.get('Authorization')
    const tokenStr = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : request.cookies.get('nexuschess_token')?.value
    
    if (!tokenStr) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(tokenStr)

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        analysis: true,
        mistakes: {
          orderBy: { moveNumber: 'asc' }
        }
      }
    })

    if (!game || game.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      game
    })
  } catch (error) {
    console.error('Get game error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}