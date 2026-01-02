'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalysisData {
  averageAccuracy: number
  blunders: number
  mistakes: number
  inaccuracies: number
  brilliantMoves: number
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

interface AnalysisPanelProps {
  analysis: AnalysisData | null
  loading?: boolean
}

export default function AnalysisPanel({ analysis, loading }: AnalysisPanelProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Analyzing game...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No analysis available</p>
        </CardContent>
      </Card>
    )
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 80) return 'text-blue-600'
    if (accuracy >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Overall Accuracy */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className={`text-5xl font-bold ${getAccuracyColor(analysis.averageAccuracy)}`}>
              {analysis.averageAccuracy.toFixed(1)}%
            </p>
            <p className="text-gray-600 mt-2">Average Accuracy</p>
          </div>
        </CardContent>
      </Card>

      {/* Move Quality */}
      <Card>
        <CardHeader>
          <CardTitle>Move Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.brilliantMoves > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-cyan-600 font-semibold">✨ Brilliant</span>
                <span className="text-2xl font-bold text-cyan-600">{analysis.brilliantMoves}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-yellow-600 font-semibold">⚠️ Inaccuracies</span>
              <span className="text-2xl font-bold text-yellow-600">{analysis.inaccuracies}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-orange-600 font-semibold">❌ Mistakes</span>
              <span className="text-2xl font-bold text-orange-600">{analysis.mistakes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-600 font-semibold">💥 Blunders</span>
              <span className="text-2xl font-bold text-red-600">{analysis.blunders}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Opening */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Opening</span>
                <span className={`font-bold ${getAccuracyColor(analysis.openingPhase.accuracy)}`}>
                  {analysis.openingPhase.accuracy.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${analysis.openingPhase.accuracy}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {analysis.openingPhase.moves} moves
              </p>
            </div>

            {/* Middlegame */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Middlegame</span>
                <span className={`font-bold ${getAccuracyColor(analysis.middlegamePhase.accuracy)}`}>
                  {analysis.middlegamePhase.accuracy.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${analysis.middlegamePhase.accuracy}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {analysis.middlegamePhase.moves} moves
              </p>
            </div>

            {/* Endgame */}
            {analysis.endgamePhase.moves > 0 && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Endgame</span>
                  <span className={`font-bold ${getAccuracyColor(analysis.endgamePhase.accuracy)}`}>
                    {analysis.endgamePhase.accuracy.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${analysis.endgamePhase.accuracy}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {analysis.endgamePhase.moves} moves
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}