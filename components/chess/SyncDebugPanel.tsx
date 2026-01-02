'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react'

export function SyncDebugPanel() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await apiFetch('/api/test-sync')
      const data = await response.json()

      setTestResult(data)

      if (data.success) {
        toast({
          title: 'Test Successful',
          description: `User: ${data.user.username}, Chess.com: ${data.user.chesscomUsername}, Games: ${data.existingGames}`,
        })
      } else {
        toast({
          title: 'Test Failed',
          description: data.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: 'Test Error',
        description: 'Failed to run sync test',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sync Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Run Sync Test
            </>
          )}
        </Button>

        {testResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {testResult.success ? 'Connection OK' : 'Connection Failed'}
              </span>
            </div>

            {testResult.user && (
              <div className="text-xs space-y-1 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                <div><strong>Username:</strong> {testResult.user.username}</div>
                <div><strong>Chess.com:</strong> {testResult.user.chesscomUsername || 'Not linked'}</div>
                <div><strong>Existing Games:</strong> {testResult.existingGames}</div>
              </div>
            )}

            {testResult.error && (
              <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded">
                <strong>Error:</strong> {testResult.error}
                {testResult.details && (
                  <div className="mt-1"><strong>Details:</strong> {testResult.details}</div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
