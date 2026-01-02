'use client'

import { useState } from 'react'
import { Upload, Loader2, AlertCircle } from 'lucide-react'
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

interface FENImportDialogProps {
  onImportComplete?: () => void
  trigger?: React.ReactNode
}

export function FENImportDialog({ onImportComplete, trigger }: FENImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [fen, setFen] = useState('')
  const [pgn, setPgn] = useState('')
  const [opponent, setOpponent] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!fen.trim() && !pgn.trim()) {
      setError('Please enter either FEN or PGN')
      return
    }

    setImporting(true)
    setError(null)

    try {
      const response = await apiFetch('/api/games/import/fen', {
        method: 'POST',
        body: JSON.stringify({
          fen: fen.trim() || undefined,
          pgn: pgn.trim() || undefined,
          opponent: opponent.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to import game')
      }

      const result = await response.json()
      
      toast({
        title: "Import successful!",
        description: result.message,
      })

      onImportComplete?.()
      setOpen(false)
      setFen('')
      setPgn('')
      setOpponent('')
    } catch (err: any) {
      setError(err.message || 'Failed to import game. Please check the format and try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import FEN/PGN
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Game from FEN or PGN</DialogTitle>
          <DialogDescription>
            Paste a FEN position or PGN notation to import a game.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fen">FEN (Forsyth-Edwards Notation)</Label>
            <Input
              id="fen"
              placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              value={fen}
              onChange={(e) => setFen(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pgn">Or PGN (Portable Game Notation)</Label>
            <textarea
              id="pgn"
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="[Event &quot;Game&quot;]&#10;1. e4 e5 2. Nf3 Nc6..."
              value={pgn}
              onChange={(e) => setPgn(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opponent">Opponent (Optional)</Label>
            <Input
              id="opponent"
              placeholder="Opponent name"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
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
                  <Upload className="h-4 w-4 mr-2" />
                  Import Game
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

