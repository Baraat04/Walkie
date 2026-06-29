'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPlayerColor } from '@/lib/utils/colors'

interface Room {
  name: string
  expires_at: string
}

interface FinishedSummaryProps {
  roomId: string
  room: Room
  onClose: () => void
}

export default function FinishedSummary({ roomId, room, onClose }: FinishedSummaryProps) {
  const [data, setData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      // fetch participants
      const { data: parts } = await supabase
        .from('room_participants')
        .select('user_id, color, profiles(username)')
        .eq('room_id', roomId)

      // fetch territories
      const { data: terrs } = await supabase
        .from('territories')
        .select('owner_id')
        .eq('room_id', roomId)

      if (parts && terrs) {
        const counts: Record<string, number> = {}
        terrs.forEach(t => {
          if (t.owner_id) counts[t.owner_id] = (counts[t.owner_id] || 0) + 1
        })

        const total = terrs.length || 1 // avoid div 0

        const combined = parts.map(p => ({
          user_id: p.user_id,
          username: (p.profiles as any)?.[0]?.username || p.user_id,
          color: p.color || getPlayerColor(p.user_id),
          cells: counts[p.user_id] || 0,
          percentage: ((counts[p.user_id] || 0) / total) * 100
        }))

        combined.sort((a, b) => b.cells - a.cells)
        setData(combined)
      }
    }
    load()
  }, [roomId, supabase])

  return (
    <div className="absolute top-0 left-0 w-full z-[2000] bg-white shadow-xl border-b border-gray-200 transform transition-transform duration-300 rounded-b-3xl max-h-[85vh] overflow-y-auto">
      <div className="p-6 relative">
        <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8 pt-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Match Final Results</h2>
          <p className="text-sm font-medium text-gray-500 mt-2">{room.name} • Completed</p>
        </div>

        {data.length > 0 && (
          <div className="flex flex-col items-center mb-8">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Winner</span>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full shadow-sm" style={{ background: data[0].color }} />
              <span className="text-3xl font-black text-gray-900">{data[0].username}</span>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold mt-3 border border-blue-100">
              {data[0].percentage.toFixed(1)}% Territory
            </div>
          </div>
        )}

        <div className="space-y-2">
          {data.map((p, i) => (
            <div key={p.user_id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-400 w-4 text-center">{i + 1}</span>
                <div className="w-5 h-5 rounded-full shadow-sm" style={{ background: p.color }} />
                <span className="text-sm font-bold text-gray-900">{p.username}</span>
              </div>
              <span className="text-sm font-black text-gray-700">{p.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
