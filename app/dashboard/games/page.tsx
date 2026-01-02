'use client'

import { useState, useEffect } from 'react'
import { GameList } from '@/components/chess/GameList'

export default function GamesPage() {
  return (
    <div className="w-full max-w-full pt-4">
      <GameList />
    </div>
  )
}
