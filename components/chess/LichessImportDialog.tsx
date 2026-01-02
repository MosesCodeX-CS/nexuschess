'use client'

import { useState } from 'react'
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from '@/components/ui/use-toast'

interface LichessImportDialogProps {
  onImportComplete?: () => void
  trigger?: React.ReactNode
}

export function LichessImportDialog({ onImportComplete, trigger }: LichessImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!username.trim()) {
      setError('Please enter a Lichess username')
      return
    }

    setImporting(true)
    setError(null)

    try {
      const response = await apiFetch('/api/games/import/lichess', {
        method: 'POST',
        body: JSON.stringify({ username, max: 50 }),
      })

      if (!response.ok) {
        throw new Error('Failed to import games')
      }

      const result = await response.json()
      
      toast({
        title: "Import successful!",
        description: result.message,
      })

      onImportComplete?.()
      setOpen(false)
      setUsername('')
    } catch (err) {
      setError('Failed to import games. Please check the username and try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Import from Lichess
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Games from Lichess</DialogTitle>
          <DialogDescription>
            Enter your Lichess username to import your recent games.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lichess-username">Lichess Username</Label>
            <Input
              id="lichess-username"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import Games
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

