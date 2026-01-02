import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/auth'
import { GameAnalyzer } from '@/lib/chess/analyzer'

export async function POST(request: NextRequest) {
  try {
    // Get token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      )
    }

    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json(
        { success: false, message: 'Game ID required' },
        { status: 400 }
      )
    }

    // Get game
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game || game.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if analysis already exists
    const existingAnalysis = await prisma.analysis.findUnique({
      where: { gameId }
    })

    if (existingAnalysis) {
      return NextResponse.json({
        success: true,
        analysis: existingAnalysis,
        cached: true
      })
    }

    // Analyze game
    const analyzer = new GameAnalyzer()
    const analysis = await analyzer.analyzeGame(game.pgn, game.playerColor as 'white' | 'black')

    // Save analysis
    const savedAnalysis = await prisma.analysis.create({
      data: {
        gameId,
        engineDepth: 15,
        averageAccuracy: analysis.averageAccuracy,
        blunders: analysis.blunders,
        mistakes: analysis.mistakes,
        inaccuracies: analysis.inaccuracies,
        brilliantMoves: analysis.brilliantMoves,
        openingPhase: analysis.openingPhase,
        middlegamePhase: analysis.middlegamePhase,
        endgamePhase: analysis.endgamePhase
      }
    })

    // Save mistakes
    await Promise.all(
      analysis.mistakesList.map(mistake =>
        prisma.mistake.create({
          data: {
            gameId,
            moveNumber: mistake.moveNumber,
            fen: mistake.fen,
            playedMove: mistake.playedMove,
            bestMove: mistake.bestMove,
            evaluation: mistake.evaluation,
            previousEval: mistake.previousEval,
            severity: mistake.severity,
            phase: mistake.phase,
            explanation: mistake.explanation
          }
        })
      )
    )

    // Update game accuracy
    await prisma.game.update({
      where: { id: gameId },
      data: { accuracy: analysis.averageAccuracy }
    })

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      mistakes: analysis.mistakesList
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { success: false, message: 'Analysis failed' },
      { status: 500 }
    )
  }
}