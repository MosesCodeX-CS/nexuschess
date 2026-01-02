import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { verifyChessComUser } from '@/lib/api/chess-com'
import { RegisterData, AuthResponse } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json()
    const { email, username, password, chesscomUsername } = body

    // Validation
    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' } as AuthResponse,
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email or username already exists' } as AuthResponse,
        { status: 400 }
      )
    }

    // Verify Chess.com username if provided
    let chesscomVerified = false
    if (chesscomUsername) {
      chesscomVerified = await verifyChessComUser(chesscomUsername)
      if (!chesscomVerified) {
        return NextResponse.json(
          { success: false, message: 'Chess.com username not found' } as AuthResponse,
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        chesscomUsername: chesscomUsername || null,
        chesscomVerified,
      },
      select: {
        id: true,
        email: true,
        username: true,
        chesscomUsername: true,
        chesscomVerified: true,
        rating: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
      }
    })

    // Generate token
    const token = generateToken(user.id, user.email)

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        token,
        user,
      } as AuthResponse,
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as AuthResponse,
      { status: 500 }
    )
  }
}