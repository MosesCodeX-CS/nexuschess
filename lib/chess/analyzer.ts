import { Chess } from 'chess.js'
import { StockfishEngine } from './engine'

export interface MistakeAnalysis {
  moveNumber: number
  fen: string
  playedMove: string
  bestMove: string
  evaluation: number
  previousEval: number
  severity: 'blunder' | 'mistake' | 'inaccuracy'
  phase: 'opening' | 'middlegame' | 'endgame'
  explanation: string
}

export interface GameAnalysis {
  averageAccuracy: number
  blunders: number
  mistakes: number
  inaccuracies: number
  brilliantMoves: number
  mistakesList: MistakeAnalysis[]
  openingPhase: {
    accuracy: number
    moves: number
  }
  middlegamePhase: {
    accuracy: number
    moves: number
  }
  endgamePhase: {
    accuracy: number
    moves: number
  }
}

export class GameAnalyzer {
  private engine: StockfishEngine

  constructor() {
    this.engine = new StockfishEngine()
  }

  async initialize() {
    await this.engine.initialize()
  }

  private determinePhase(moveNumber: number, pieces: number): 'opening' | 'middlegame' | 'endgame' {
    if (moveNumber <= 10) return 'opening'
    if (pieces <= 12) return 'endgame'
    return 'middlegame'
  }

  private classifyMistake(evalDrop: number): 'blunder' | 'mistake' | 'inaccuracy' | null {
    if (Math.abs(evalDrop) >= 3) return 'blunder'
    if (Math.abs(evalDrop) >= 1.5) return 'mistake'
    if (Math.abs(evalDrop) >= 0.5) return 'inaccuracy'
    return null
  }

  private generateExplanation(mistake: {
    playedMove: string
    bestMove: string
    evalDrop: number
    severity: string
  }): string {
    const explanations = {
      blunder: `This move loses significant material or position. The evaluation dropped by ${Math.abs(mistake.evalDrop).toFixed(1)} pawns. Consider ${mistake.bestMove} instead.`,
      mistake: `This move gives away an advantage. A better continuation was ${mistake.bestMove}, maintaining your position.`,
      inaccuracy: `Not the most precise move. ${mistake.bestMove} would have been slightly better.`
    }
    
    return explanations[mistake.severity as keyof typeof explanations] || 'Suboptimal move.'
  }

  async analyzeGame(pgn: string, playerColor: 'white' | 'black'): Promise<GameAnalysis> {
    await this.initialize()

    const chess = new Chess()
    chess.loadPgn(pgn)
    const history = chess.history({ verbose: true })

    let blunders = 0
    let mistakes = 0
    let inaccuracies = 0
    let brilliantMoves = 0
    const mistakesList: MistakeAnalysis[] = []

    let previousEval = 0
    let totalMoves = 0
    let totalAccuracy = 0

    // Phase tracking
    const phases = {
      opening: { accuracy: 0, moves: 0 },
      middlegame: { accuracy: 0, moves: 0 },
      endgame: { accuracy: 0, moves: 0 }
    }

    // Reset to starting position
    chess.reset()

    for (let i = 0; i < history.length; i++) {
      const move = history[i]
      const isPlayerMove = (playerColor === 'white' && i % 2 === 0) || 
                           (playerColor === 'black' && i % 2 === 1)

      if (!isPlayerMove) {
        chess.move(move.san)
        continue
      }

      // Get position before the move
      const fenBeforeMove = chess.fen()

      // Analyze position
      const analysis = await this.engine.analyze(fenBeforeMove, 15)
      const bestMove = analysis.move
      const currentEval = analysis.evaluation

      // Make the actual move
      chess.move(move.san)

      // Calculate evaluation after the move
      const fenAfterMove = chess.fen()
      const evalAfterMove = await this.engine.evaluatePosition(fenAfterMove, 12)

      // Adjust evaluation based on player color
      const adjustedPrevEval = playerColor === 'white' ? previousEval : -previousEval
      const adjustedCurrentEval = playerColor === 'white' ? evalAfterMove : -evalAfterMove

      const evalDrop = adjustedPrevEval - adjustedCurrentEval

      // Determine game phase
      const pieces = chess.board().flat().filter(p => p !== null).length
      const phase = this.determinePhase(Math.floor(i / 2) + 1, pieces)

      // Calculate move accuracy (100% if eval improves, scales down based on eval drop)
      let moveAccuracy = 100
      if (evalDrop > 0) {
        moveAccuracy = Math.max(0, 100 - (evalDrop * 20))
      }

      totalAccuracy += moveAccuracy
      totalMoves++

      phases[phase].accuracy += moveAccuracy
      phases[phase].moves++

      // Classify mistake
      const severity = this.classifyMistake(evalDrop)

      if (severity) {
        if (severity === 'blunder') blunders++
        else if (severity === 'mistake') mistakes++
        else if (severity === 'inaccuracy') inaccuracies++

        mistakesList.push({
          moveNumber: Math.floor(i / 2) + 1,
          fen: fenBeforeMove,
          playedMove: move.san,
          bestMove,
          evaluation: adjustedCurrentEval,
          previousEval: adjustedPrevEval,
          severity,
          phase,
          explanation: this.generateExplanation({
            playedMove: move.san,
            bestMove,
            evalDrop,
            severity
          })
        })
      } else if (evalDrop < -1) {
        // Brilliant move
        brilliantMoves++
      }

      previousEval = evalAfterMove
    }

    this.engine.terminate()

    return {
      averageAccuracy: totalMoves > 0 ? totalAccuracy / totalMoves : 0,
      blunders,
      mistakes,
      inaccuracies,
      brilliantMoves,
      mistakesList,
      openingPhase: {
        accuracy: phases.opening.moves > 0 ? phases.opening.accuracy / phases.opening.moves : 0,
        moves: phases.opening.moves
      },
      middlegamePhase: {
        accuracy: phases.middlegame.moves > 0 ? phases.middlegame.accuracy / phases.middlegame.moves : 0,
        moves: phases.middlegame.moves
      },
      endgamePhase: {
        accuracy: phases.endgame.moves > 0 ? phases.endgame.accuracy / phases.endgame.moves : 0,
        moves: phases.endgame.moves
      }
    }
  }
}