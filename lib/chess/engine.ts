interface EngineMove {
  move: string
  evaluation: number
  mate?: number
  depth: number
  pv?: string[] // Principal variation
}

export class StockfishEngine {
  private worker: Worker | null = null
  private ready = false
  private messageQueue: ((value: any) => void)[] = []

  async initialize() {
    if (typeof window === 'undefined') return

    this.worker = new Worker('/stockfish.js')
    
    return new Promise<void>((resolve) => {
      if (!this.worker) return

      this.worker.onmessage = (e) => {
        const message = e.data
        
        if (message === 'uciok') {
          this.ready = true
          this.send('setoption name Threads value 2')
          this.send('setoption name Hash value 128')
          resolve()
        }

        // Handle queued message handlers
        if (this.messageQueue.length > 0) {
          const handler = this.messageQueue.shift()
          handler?.(message)
        }
      }

      this.send('uci')
    })
  }

  private send(command: string) {
    if (this.worker) {
      this.worker.postMessage(command)
    }
  }

  async analyze(fen: string, depth: number = 18): Promise<EngineMove> {
    if (!this.ready) await this.initialize()

    return new Promise((resolve) => {
      let bestMove = ''
      let evaluation = 0
      let mate: number | undefined
      let currentDepth = 0
      let pv: string[] = []

      const messageHandler = (message: string) => {
        if (message.startsWith('info depth')) {
          // Parse engine output
          const depthMatch = message.match(/depth (\d+)/)
          const scoreMatch = message.match(/score (cp|mate) (-?\d+)/)
          const pvMatch = message.match(/pv (.+)/)

          if (depthMatch) {
            currentDepth = parseInt(depthMatch[1])
          }

          if (scoreMatch) {
            const [, type, value] = scoreMatch
            if (type === 'cp') {
              evaluation = parseInt(value) / 100 // Convert centipawns to pawns
            } else if (type === 'mate') {
              mate = parseInt(value)
              evaluation = mate > 0 ? 100 : -100
            }
          }

          if (pvMatch) {
            pv = pvMatch[1].split(' ')
          }
        }

        if (message.startsWith('bestmove')) {
          const moveMatch = message.match(/bestmove (\S+)/)
          if (moveMatch) {
            bestMove = moveMatch[1]
            resolve({
              move: bestMove,
              evaluation,
              mate,
              depth: currentDepth,
              pv
            })
          }
        } else {
          this.messageQueue.push(messageHandler)
        }
      }

      this.messageQueue.push(messageHandler)
      this.send(`position fen ${fen}`)
      this.send(`go depth ${depth}`)
    })
  }

  async evaluatePosition(fen: string, depth: number = 15): Promise<number> {
    const result = await this.analyze(fen, depth)
    return result.evaluation
  }

  async getBestMove(fen: string, depth: number = 18): Promise<string> {
    const result = await this.analyze(fen, depth)
    return result.move
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.ready = false
    }
  }
}

export const stockfish = new StockfishEngine()