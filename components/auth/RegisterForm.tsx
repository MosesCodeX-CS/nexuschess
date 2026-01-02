'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    chesscomUsername: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifyingChessCom, setVerifyingChessCom] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.email || !formData.username || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          chesscomUsername: formData.chesscomUsername || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Store token
        localStorage.setItem('nexuschess_token', data.token)
        localStorage.setItem('nexuschess_user', JSON.stringify(data.user))
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const verifyChessComUsername = async () => {
    if (!formData.chesscomUsername) return

    setVerifyingChessCom(true)
    try {
      const response = await fetch(
        `https://api.chess.com/pub/player/${formData.chesscomUsername}`
      )
      if (response.ok) {
        alert('✅ Chess.com username verified!')
      } else {
        setError('Chess.com username not found')
      }
    } catch {
      setError('Could not verify Chess.com username')
    } finally {
      setVerifyingChessCom(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Join NexusChess and start improving your game
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chesscomUsername">
              Chess.com Username (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="chesscomUsername"
                name="chesscomUsername"
                type="text"
                placeholder="Your Chess.com username"
                value={formData.chesscomUsername}
                onChange={handleChange}
              />
              {formData.chesscomUsername && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={verifyChessComUsername}
                  disabled={verifyingChessCom}
                >
                  {verifyingChessCom ? 'Verifying...' : 'Verify'}
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Connect your Chess.com account to sync your games automatically
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Login here
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}