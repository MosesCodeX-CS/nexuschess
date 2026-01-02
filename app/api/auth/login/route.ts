import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { LoginData, AuthResponse } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const body: LoginData = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' } as AuthResponse,
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' } as AuthResponse,
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' } as AuthResponse,
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken(user.id, user.email)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        user: userWithoutPassword,
      } as AuthResponse,
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as AuthResponse,
      { status: 500 }
    )
  }
}