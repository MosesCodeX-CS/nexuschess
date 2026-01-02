'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Plus, 
  Trophy, 
  Brain, 
  Target, 
  TrendingUp,
  Crown,
  Zap,
  Flame,
  Star,
  CheckCircle,
  ExternalLink,
  Activity,
  BarChart3
} from 'lucide-react'
import { GameList } from '@/components/chess/GameList'
import { GameImportDialog } from '@/components/chess/GameImportDialog'
import { ChessBoard } from '@/components/chess/ChessBoard'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const token = localStorage.getItem('nexuschess_token')
    const userData = localStorage.getItem('nexuschess_user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('nexuschess_token')
    localStorage.removeItem('nexuschess_user')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 pointer-events-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-blue-100">Welcome back! Track your chess progress and improve your game</p>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 bg-white border border-gray-200 shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="games" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">My Games</TabsTrigger>
            <TabsTrigger value="play" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Play</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-700">Rating</CardTitle>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{user.rating || 1200}</div>
                  <p className="text-xs text-gray-600">Current rating</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-700">Chess.com</CardTitle>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {user.chesscomUsername ? (
                    <div>
                      <div className="text-2xl font-bold text-green-600 mb-1">{user.chesscomUsername}</div>
                      <div className="flex items-center gap-2">
                        {user.chesscomVerified ? (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Pending verification
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold text-gray-400 mb-1">Not connected</div>
                      <p className="text-xs text-gray-500">Link to import games</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-700">Games Analyzed</CardTitle>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Brain className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-1">0</div>
                  <p className="text-xs text-gray-600">Import games to start</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-700">Tactics Solved</CardTitle>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Trophy className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-orange-600 mb-1">0</div>
                  <p className="text-xs text-gray-600">Keep practicing!</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Zap className="h-5 w-5 text-gray-600" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <GameImportDialog
                    chessComUsername={user.chesscomUsername || undefined}
                    onImportComplete={() => setActiveTab('games')}
                    trigger={
                      <Button className="w-full h-auto p-4 flex flex-col gap-2 border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                        <Download className="h-6 w-6" />
                        <span className="font-semibold">Import Chess.com Games</span>
                        <span className="text-xs opacity-90">Connect and analyze</span>
                      </Button>
                    }
                  />
                  <Button 
                    className="w-full h-auto p-4 flex flex-col gap-2 border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                    onClick={() => setActiveTab('games')}
                  >
                    <Brain className="h-6 w-6" />
                    <span className="font-semibold">Analyze a Game</span>
                    <span className="text-xs opacity-90">Review your moves</span>
                  </Button>
                  <Button 
                    className="w-full h-auto p-4 flex flex-col gap-2 border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-orange-500 to-red-500 text-white"
                    onClick={() => setActiveTab('play')}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="font-semibold">Practice Puzzles</span>
                    <span className="text-xs opacity-90">Improve tactics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games">
            <GameList userId={user.id} />
          </TabsContent>

          {/* Play Tab */}
          <TabsContent value="play">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    Practice Board
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ChessBoard
                    showControls={true}
                    showMoveHistory={true}
                    orientation="white"
                  />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Brain className="h-5 w-5 text-green-600" />
                      </div>
                      How to Practice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex gap-3">
                      <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-blue-600 shadow-sm">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Import Your Games</p>
                        <p className="text-sm text-gray-600">
                          Connect your Chess.com account and import your recent games
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-blue-600 shadow-sm">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Review Your Play</p>
                        <p className="text-sm text-gray-600">
                          Step through each move to understand what happened
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-blue-600 shadow-sm">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Learn from Mistakes</p>
                        <p className="text-sm text-gray-600">
                          Identify patterns and improve your skills
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
                  <CardHeader className="border-b border-yellow-100">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      Coming Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Puzzle Rush challenges
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Opening trainer
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Endgame practice
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        AI analysis of your games
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


