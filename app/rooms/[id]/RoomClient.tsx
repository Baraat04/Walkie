'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import LeaderBoard from '@/components/rooms/LeaderBoard'

// Leaflet must be client-only (no SSR)
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
      <svg className="w-8 h-8 text-blue-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-gray-500 text-sm">Loading map...</p>
    </div>
  ),
})

interface Room {
  id: string
  name: string
  status: string
  expires_at: string
  invite_code: string
}

interface RoomClientProps {
  room: Room
  userId: string
  userColor: string
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export default function RoomClient({ room, userId, userColor }: RoomClientProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const expired = new Date(room.expires_at) < new Date()

  return (
    <div className="relative h-full">
      {/* Expired banner */}
      {expired && (
        <div className="absolute top-0 left-0 right-0 z-[999] bg-red-500/90 backdrop-blur-sm text-white text-center text-xs py-2 font-bold shadow-sm">
          This room has ended &mdash; territory is now locked
        </div>
      )}

      {/* Map — full screen */}
      <div className="absolute inset-0">
        <MapView roomId={room.id} userId={userId} userColor={userColor} />
      </div>

      {/* Top info pill */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full px-4 py-1.5 border border-gray-200 flex items-center gap-2 shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-semibold text-gray-900 truncate max-w-[160px]">{room.name}</span>
        <span className="text-xs text-gray-300">&bull;</span>
        <span className="text-xs text-gray-500">{timeRemaining(room.expires_at)}</span>
      </div>

      {/* Leaderboard toggle button */}
      <button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="absolute bottom-6 left-4 z-[1000] bg-white rounded-full px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-md flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
        <span className="text-xs">{showLeaderboard ? 'Hide' : 'Ranks'}</span>
      </button>

      {/* Leaderboard panel (slides in) */}
      {showLeaderboard && (
        <div className="absolute bottom-20 left-4 z-[1000] w-64 h-72">
          <LeaderBoard roomId={room.id} />
        </div>
      )}

      {/* Player color indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-gray-200 shadow-sm">
        <div className="w-3 h-3 rounded-full" style={{ background: userColor }} />
        <span className="text-[11px] text-gray-500 font-medium">Your color</span>
      </div>
    </div>
  )
}
