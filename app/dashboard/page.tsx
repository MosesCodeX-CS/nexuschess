'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.username}!</h1>
            <p className="text-gray-600">Ready to improve your chess?</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{user.rating}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chess.com Account</CardTitle>
            </CardHeader>
            <CardContent>
              {user.chesscomUsername ? (
                <div>
                  <p className="font-semibold">{user.chesscomUsername}</p>
                  <p className="text-sm text-green-600">
                    {user.chesscomVerified ? '✅ Verified' : '⏳ Pending'}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Not connected</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Games Analyzed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">0</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" disabled>
                Sync Chess.com Games (Coming Soon)
              </Button>
              <Button className="w-full" variant="outline" disabled>
                Analyze a Game (Coming Soon)
              </Button>
              <Button className="w-full" variant="outline" disabled>
                Practice Puzzles (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}