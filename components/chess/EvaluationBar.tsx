'use client'

interface EvaluationBarProps {
  evaluation: number
  mate?: number
}

export default function EvaluationBar({ evaluation, mate }: EvaluationBarProps) {
  // Clamp evaluation between -10 and +10 for display
  const clampedEval = Math.max(-10, Math.min(10, evaluation))
  
  // Convert evaluation to percentage (0-100)
  // 0 = -10 eval (black winning), 50 = 0 eval (equal), 100 = +10 eval (white winning)
  const percentage = ((clampedEval + 10) / 20) * 100

  const getEvalText = () => {
    if (mate !== undefined) {
      return mate > 0 ? `M${mate}` : `M${Math.abs(mate)}`
    }
    return evaluation > 0 ? `+${evaluation.toFixed(1)}` : evaluation.toFixed(1)
  }

  const getEvalColor = () => {
    if (mate !== undefined) {
      return mate > 0 ? 'text-white' : 'text-gray-900'
    }
    if (Math.abs(evaluation) < 0.5) return 'text-gray-600'
    return evaluation > 0 ? 'text-white' : 'text-gray-900'
  }

  return (
    <div className="w-full">
      <div className="relative h-8 bg-gray-800 rounded overflow-hidden">
        {/* White advantage bar */}
        <div
          className="absolute top-0 left-0 h-full bg-white transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Evaluation text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-sm ${getEvalColor()}`}>
            {getEvalText()}
          </span>
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-1 text-xs text-gray-600">
        <span>Black</span>
        <span>White</span>
      </div>
    </div>
  )
}