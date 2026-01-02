'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Calendar,
  Clock,
  Zap,
  Star,
  User,
  Crown,
  CheckCircle,
  ExternalLink,
  Award,
  Flame,
  BarChart3,
  Activity,
  Settings
} from 'lucide-react'
import { getChessComStats } from '@/lib/api/chess-com'
import { getLichessUser } from '@/lib/api/lichess'
import { ChessComStats } from '@/lib/api/chess-com'

interface LichessStats {
  username: string
  classical?: { rating: number; games: number }
  rapid?: { rating: number; games: number }
  blitz?: { rating: number; games: number }
  bullet?: { rating: number; games: number }
  ultraBullet?: { rating: number; games: number }
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [chessComStats, setChessComStats] = useState<ChessComStats | null>(null)
  const [lichessStats, setLichessStats] = useState<LichessStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('nexuschess_user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (user?.chesscomUsername) {
      fetchChessComStats()
    }
    if (user?.lichessUsername) {
      fetchLichessStats()
    }
    setLoading(false)
  }, [user])

  const fetchChessComStats = async () => {
    try {
      const stats = await getChessComStats(user.chesscomUsername)
      setChessComStats(stats)
    } catch (error) {
      console.error('Failed to fetch Chess.com stats:', error)
    }
  }

  const fetchLichessStats = async () => {
    try {
      const stats = await getLichessUser(user.lichessUsername)
      if (stats) {
        setLichessStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch Lichess stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const calculateWinRate = (record: any) => {
    if (!record) return 0
    const total = record.win + record.loss + record.draw
    return total > 0 ? Math.round((record.win / total) * 100) : 0
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header Card */}
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10"></div>
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                <User className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user?.username}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {user?.chesscomVerified && (
                    <Badge className="bg-green-100 text-green-700 border-0 px-3 py-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Chess.com Verified
                    </Badge>
                  )}
                  {user?.lichessVerified && (
                    <Badge className="bg-blue-100 text-blue-700 border-0 px-3 py-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Lichess Verified
                    </Badge>
                  )}
                  <Badge className="bg-purple-100 text-purple-700 border-0 px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Premium Member
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Rating: {user?.rating || 1200}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>Joined: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>0 day streak</span>
                </div>
              </div>
            </div>

            {/* Settings Button */}
            <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chess.com Stats */}
        {chessComStats && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  Chess.com Statistics
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-green-600">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {chessComStats.chess_blitz && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">Blitz</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {chessComStats.chess_blitz.last.rating}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Wins:</span>
                        <span className="font-semibold text-green-600">{chessComStats.chess_blitz.record.win}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Losses:</span>
                        <span className="font-semibold text-red-600">{chessComStats.chess_blitz.record.loss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Draws:</span>
                        <span className="font-semibold text-gray-600">{chessComStats.chess_blitz.record.draw}</span>
                      </div>
                    </div>
                  </div>
                )}

                {chessComStats.chess_rapid && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-600">Rapid</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {chessComStats.chess_rapid.last.rating}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Wins:</span>
                        <span className="font-semibold text-green-600">{chessComStats.chess_rapid.record.win}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Losses:</span>
                        <span className="font-semibold text-red-600">{chessComStats.chess_rapid.record.loss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Draws:</span>
                        <span className="font-semibold text-gray-600">{chessComStats.chess_rapid.record.draw}</span>
                      </div>
                    </div>
                  </div>
                )}

                {chessComStats.chess_bullet && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-600">Bullet</span>
                    </div>
                    <div className="text-3xl font-bold text-orange-600 mb-1">
                      {chessComStats.chess_bullet.last.rating}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Wins:</span>
                        <span className="font-semibold text-green-600">{chessComStats.chess_bullet.record.win}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Losses:</span>
                        <span className="font-semibold text-red-600">{chessComStats.chess_bullet.record.loss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Draws:</span>
                        <span className="font-semibold text-gray-600">{chessComStats.chess_bullet.record.draw}</span>
                      </div>
                    </div>
                  </div>
                )}

                {chessComStats.chess_daily && (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-600">Daily</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {chessComStats.chess_daily.last.rating}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Wins:</span>
                        <span className="font-semibold text-green-600">{chessComStats.chess_daily.record.win}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Losses:</span>
                        <span className="font-semibold text-red-600">{chessComStats.chess_daily.record.loss}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Draws:</span>
                        <span className="font-semibold text-gray-600">{chessComStats.chess_daily.record.draw}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lichess Stats */}
        {lichessStats && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Activity className="h-5 w-5 text-gray-600" />
                  </div>
                  Lichess Statistics
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {lichessStats.classical && (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                    <p className="text-xs font-medium text-gray-600 mb-2">Classical</p>
                    <p className="text-2xl font-bold text-purple-600">{lichessStats.classical.rating}</p>
                    <p className="text-xs text-gray-500 mt-1">{lichessStats.classical.games} games</p>
                  </div>
                )}
                {lichessStats.rapid && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <p className="text-xs font-medium text-gray-600 mb-2">Rapid</p>
                    <p className="text-2xl font-bold text-blue-600">{lichessStats.rapid.rating}</p>
                    <p className="text-xs text-gray-500 mt-1">{lichessStats.rapid.games} games</p>
                  </div>
                )}
                {lichessStats.blitz && (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                    <p className="text-xs font-medium text-gray-600 mb-2">Blitz</p>
                    <p className="text-2xl font-bold text-green-600">{lichessStats.blitz.rating}</p>
                    <p className="text-xs text-gray-500 mt-1">{lichessStats.blitz.games} games</p>
                  </div>
                )}
                {lichessStats.bullet && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                    <p className="text-xs font-medium text-gray-600 mb-2">Bullet</p>
                    <p className="text-2xl font-bold text-orange-600">{lichessStats.bullet.rating}</p>
                    <p className="text-xs text-gray-500 mt-1">{lichessStats.bullet.games} games</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Analysis */}
      {chessComStats && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              Win Rate Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {chessComStats.chess_blitz && (
                <div>
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">Blitz</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {chessComStats.chess_blitz.record.win + chessComStats.chess_blitz.record.loss + chessComStats.chess_blitz.record.draw} games
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {calculateWinRate(chessComStats.chess_blitz.record)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={calculateWinRate(chessComStats.chess_blitz.record)} 
                    className="h-3 bg-gray-100"
                  />
                </div>
              )}

              {chessComStats.chess_rapid && (
                <div>
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-700">Rapid</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {chessComStats.chess_rapid.record.win + chessComStats.chess_rapid.record.loss + chessComStats.chess_rapid.record.draw} games
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {calculateWinRate(chessComStats.chess_rapid.record)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={calculateWinRate(chessComStats.chess_rapid.record)} 
                    className="h-3 bg-gray-100"
                  />
                </div>
              )}

              {chessComStats.chess_bullet && (
                <div>
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-semibold text-gray-700">Bullet</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {chessComStats.chess_bullet.record.win + chessComStats.chess_bullet.record.loss + chessComStats.chess_bullet.record.draw} games
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {calculateWinRate(chessComStats.chess_bullet.record)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={calculateWinRate(chessComStats.chess_bullet.record)} 
                    className="h-3 bg-gray-100"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="h-5 w-5 text-yellow-600" />
            </div>
            Achievements & Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl text-center border border-yellow-100">
              <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">First Win</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl text-center border border-blue-100">
              <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">100 Games</p>
              <p className="text-xs text-gray-500 mt-1">Locked</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center border border-purple-100">
              <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">Master</p>
              <p className="text-xs text-gray-500 mt-1">Locked</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-center border border-green-100">
              <Flame className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">7 Day Streak</p>
              <p className="text-xs text-gray-500 mt-1">Locked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}