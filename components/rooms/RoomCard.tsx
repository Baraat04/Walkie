'use client'

import Link from 'next/link'

interface Room {
  id: string
  name: string
  status: string
  expires_at: string
  max_players: number
  invite_code: string
  created_by: string
  created_at: string
  participant_count?: number
}

interface RoomCardProps {
  room: Room
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function RoomCard({ room }: RoomCardProps) {
  const expired = new Date(room.expires_at) < new Date()
  const remaining = timeRemaining(room.expires_at)
  const count = room.participant_count ?? 0
  const fillPct = Math.min(100, (count / room.max_players) * 100)

  return (
    <Link href={`/rooms/${room.id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 active:scale-[0.98]">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{room.name}</h3>
          </div>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            expired
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-green-50 border-green-200 text-green-600'
          }`}>
            {expired ? 'ENDED' : 'LIVE'}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {remaining}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            {count}/{room.max_players}
          </span>
          <span className="ml-auto text-blue-600/70 font-mono text-[10px]">#{room.invite_code}</span>
        </div>

        {/* Fill bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
