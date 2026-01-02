'use client'

import { useState } from 'react'
import { Download, Loader2, AlertCircle, Clock, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api/fetch'
import { toast } from '@/components/ui/use-toast'

interface BulkSyncDialogProps {
  onSyncComplete?: () => void
  trigger?: React.ReactNode
}

export function BulkSyncDialog({ onSyncComplete, trigger }: BulkSyncDialogProps) {
  const [open, setOpen] = useState(false)
  const [monthsBack, setMonthsBack] = useState(24)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    imported: number
    failed: number
    totalFound: number
    alreadyExisted: number
  } | null>(null)

  const handleBulkSync = async () => {
    setSyncing(true)
    setError(null)
    setResult(null)

    try {
      const response = await apiFetch('/api/games/sync-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monthsBack }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync games')
      }

      const data = await response.json()
      setResult({
        imported: data.imported,
        failed: data.failed,
        totalFound: data.totalFound,
        alreadyExisted: data.alreadyExisted,
      })

      toast({
        title: 'Bulk Sync Complete',
        description: data.message,
      })

      if (data.imported > 0) {
        onSyncComplete?.()
        setTimeout(() => setOpen(false), 2000)
      }
    } catch (error) {
      console.error('Bulk sync failed:', error)
      setError(error instanceof Error ? error.message : 'Failed to sync games')
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync games',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  const getEstimatedTime = () => {
    // Rough estimate: ~2 seconds per month of games
    const estimatedSeconds = monthsBack * 2
    if (estimatedSeconds < 60) return `${estimatedSeconds} seconds`
    if (estimatedSeconds < 3600) return `${Math.round(estimatedSeconds / 60)} minutes`
    return `${Math.round(estimatedSeconds / 3600)} hours`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Bulk Sync
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Bulk Game Sync
          </DialogTitle>
          <DialogDescription>
            Import all your games from Chess.com for a specified time period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Time Period Selection */}
          <div className="space-y-2">
            <Label htmlFor="months-back">Time Period</Label>
            <Select value={monthsBack.toString()} onValueChange={(value: string) => setMonthsBack(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last year</SelectItem>
                <SelectItem value="24">Last 2 years</SelectItem>
                <SelectItem value="36">Last 3 years</SelectItem>
                <SelectItem value="60">Last 5 years</SelectItem>
                <SelectItem value="120">All time (10 years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Est. Time</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">{getEstimatedTime()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Download className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Batch Size</p>
                <p className="text-xs text-green-700 dark:text-green-300">50 games/batch</p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">Sync Complete!</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-green-600">{result.imported}</p>
                  <p className="text-muted-foreground">New Games</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-blue-600">{result.alreadyExisted}</p>
                  <p className="text-muted-foreground">Already Synced</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-orange-600">{result.failed}</p>
                  <p className="text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{result.totalFound}</p>
                  <p className="text-muted-foreground">Total Found</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleBulkSync}
              disabled={syncing}
              className="flex-1"
            >
              {syncing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing... (may take several minutes)
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Bulk Sync
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={syncing}
            >
              Cancel
            </Button>
          </div>

          {/* Warning */}
          <div className="text-xs text-muted-foreground">
            <p>⚠️ Bulk sync can take several minutes depending on the time period and number of games.</p>
            <p>The process runs in batches to avoid overwhelming the servers.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
