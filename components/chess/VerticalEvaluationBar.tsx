'use client'

interface VerticalEvaluationBarProps {
  evaluation: number
  mate?: number
  orientation?: 'white' | 'black'
  height?: number
}

export default function VerticalEvaluationBar({ 
  evaluation, 
  mate, 
  orientation = 'white',
  height = 400 
}: VerticalEvaluationBarProps) {
  // Clamp evaluation between -10 and +10 for display
  const clampedEval = Math.max(-10, Math.min(10, evaluation))
  
  // Convert evaluation to percentage (0-100)
  // 0 = -10 eval (black winning), 50 = 0 eval (equal), 100 = +10 eval (white winning)
  let percentage = ((clampedEval + 10) / 20) * 100
  
  // Invert percentage for black orientation
  if (orientation === 'black') {
    percentage = 100 - percentage
  }

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
    <div className="flex flex-col items-center">
      {/* Evaluation text at top */}
      <div className="mb-2 text-center">
        <span className={`font-bold text-sm ${getEvalColor()}`}>
          {getEvalText()}
        </span>
      </div>
      
      {/* Vertical evaluation bar */}
      <div 
        className="relative w-8 bg-gray-800 rounded overflow-hidden border border-gray-300"
        style={{ height: `${height}px` }}
      >
        {/* White advantage bar (from bottom for white, top for black) */}
        <div
          className={`absolute bottom-0 left-0 w-full bg-white transition-all duration-300 ${
            orientation === 'black' ? 'top-0 bottom-auto' : 'bottom-0 top-auto'
          }`}
          style={{ 
            height: `${percentage}%`,
            ...(orientation === 'black' ? { height: `${percentage}%` } : {})
          }}
        />
        
        {/* Middle line for equal position */}
        <div 
          className={`absolute left-0 right-0 h-0.5 bg-gray-400 ${
            orientation === 'white' ? 'bottom-1/2' : 'top-1/2'
          }`}
          style={{
            ...(orientation === 'white' ? { bottom: '50%' } : { top: '50%' })
          }}
        />
        
        {/* Current position indicator */}
        <div 
          className={`absolute left-0 right-0 h-1 bg-blue-500 transition-all duration-300 ${
            orientation === 'white' ? 'bottom-0' : 'top-0'
          }`}
          style={{
            ...(orientation === 'white' ? { bottom: `${percentage}%` } : { top: `${percentage}%` })
          }}
        />
      </div>
      
      {/* Labels */}
      <div className="mt-2 text-xs text-gray-600 flex flex-col items-center">
        <span>{orientation === 'white' ? 'White' : 'Black'}</span>
      </div>
    </div>
  )
}
