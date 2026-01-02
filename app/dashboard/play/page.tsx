'use client'

import { useState, useEffect } from 'react'
import { ChessBoard } from '@/components/chess/ChessBoard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  RotateCcw, 
  Settings, 
  Zap, 
  Clock, 
  Crown, 
  Target,
  Brain,
  Trophy,
  Flame,
  TrendingUp,
  Swords
} from 'lucide-react'

export default function PlayPage() {
  const [user, setUser] = useState<any>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('nexuschess_user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const gameModes = [
    {
      id: 'blitz',
      title: 'Blitz',
      time: '5 min',
      icon: Zap,
      gradient: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      iconColor: 'text-orange-600',
      description: 'Fast-paced action'
    },
    {
      id: 'rapid',
      title: 'Rapid',
      time: '10 min',
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      iconColor: 'text-blue-600',
      description: 'Balanced gameplay'
    },
    {
      id: 'classical',
      title: 'Classical',
      time: '30 min',
      icon: Crown,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      iconColor: 'text-purple-600',
      description: 'Deep thinking'
    },
    {
      id: 'bullet',
      title: 'Bullet',
      time: '1 min',
      icon: Flame,
      gradient: 'from-red-500 to-rose-500',
      bgColor: 'from-red-50 to-rose-50',
      iconColor: 'text-red-600',
      description: 'Lightning fast'
    }
  ]

  const practiceOptions = [
    {
      title: 'Tactical Training',
      icon: Target,
      color: 'from-blue-500 to-cyan-500',
      description: 'Solve chess puzzles',
      difficulty: 'All levels'
    },
    {
      title: 'Endgame Practice',
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
      description: 'Master endgames',
      difficulty: 'Intermediate'
    },
    {
      title: 'Opening Study',
      icon: Brain,
      color: 'from-green-500 to-emerald-500',
      description: 'Learn openings',
      difficulty: 'Beginner'
    }
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Play Chess</h1>
          <p className="text-blue-100">Choose your game mode and start playing</p>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
      </div>

      {/* Game Modes */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Play</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gameModes.map((mode) => {
            const Icon = mode.icon
            const isSelected = selectedMode === mode.id
            
            return (
              <Card 
                key={mode.id}
                className={`group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                <CardContent className="p-6 relative text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${mode.bgColor} mb-3`}>
                    <Icon className={`h-8 w-8 ${mode.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{mode.title}</h3>
                  <Badge variant="secondary" className="mb-2">{mode.time}</Badge>
                  <p className="text-sm text-gray-600">{mode.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chess Board */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-xl">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle>Board</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-gray-100">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <ChessBoard 
                  showControls={true}
                  showMoveHistory={true}
                  orientation="white"
                />
              </div>

              {/* Game Controls Below Board */}
              <div className="mt-6 flex justify-center gap-3">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                  size="lg"
                  onClick={() => setGameStarted(!gameStarted)}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {gameStarted ? 'Game in Progress' : 'Start New Game'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2"
                >
                  <Swords className="h-5 w-5 mr-2" />
                  Play vs AI
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Games Played</span>
                  <span className="text-lg font-bold text-blue-600">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Win Rate</span>
                  <span className="text-lg font-bold text-green-600">-</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Rating</span>
                  <span className="text-lg font-bold text-purple-600">{user.rating || 1200}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Streak</span>
                  <span className="text-lg font-bold text-orange-600 flex items-center gap-1">
                    <Flame className="h-4 w-4" />
                    0 days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Practice Modes */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-600" />
                Practice Modes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {practiceOptions.map((option, index) => {
                  const Icon = option.icon
                  return (
                    <Button 
                      key={index}
                      variant="outline" 
                      className="w-full h-auto p-4 flex items-start gap-3 hover:bg-gray-50 group"
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${option.color} flex-shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {option.title}
                        </p>
                        <p className="text-xs text-gray-600">{option.description}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {option.difficulty}
                        </Badge>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Pro Tip</p>
                  <p className="text-sm text-gray-700">
                    Start with 5-minute blitz games to quickly improve your tactical awareness and time management skills.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}