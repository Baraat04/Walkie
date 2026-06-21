'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPlayerColor } from '@/lib/utils/colors'

interface Participant {
  user_id: string
  color: string
  joined_at: string
  profiles: {
    username: string
    total_captured_area: number
  } | null
}

interface RawParticipant {
  user_id: string
  color: string
  joined_at: string
  profiles: { username: string; total_captured_area: number }[] | null
}

interface Territory {
  owner_id: string | null
}

interface LeaderBoardProps {
  roomId: string
}

export default function LeaderBoard({ roomId }: LeaderBoardProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [territoryMap, setTerritoryMap] = useState<Record<string, number>>({})
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: parts } = await supabase
        .from('room_participants')
        .select('user_id, color, joined_at, profiles(username, total_captured_area)')
        .eq('room_id', roomId)
        .order('joined_at')

      const { data: terrs } = await supabase
        .from('territories')
        .select('owner_id')
        .eq('room_id', roomId)

      if (parts) {
        const normalized = (parts as RawParticipant[]).map(p => ({
          ...p,
          profiles: p.profiles?.[0] ?? null,
        }))
        setParticipants(normalized)
      }
      if (terrs) {
        const map: Record<string, number> = {}
        terrs.forEach((t: Territory) => {
          if (t.owner_id) map[t.owner_id] = (map[t.owner_id] ?? 0) + 1
        })
        setTerritoryMap(map)
      }
    }
    load()

    const sub = supabase
      .channel(`lb-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territories', filter: `room_id=eq.${roomId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` }, load)
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [roomId])

  const sorted = [...participants].sort(
    (a, b) => (territoryMap[b.user_id] ?? 0) - (territoryMap[a.user_id] ?? 0)
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 h-full overflow-hidden flex flex-col shadow-lg">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
        <span>Leaderboard</span>
        <span className="ml-auto text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{participants.length} players</span>
      </h3>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sorted.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <p className="text-xs text-gray-400">No players yet</p>
          </div>
        )}
        {sorted.map((p, i) => {
          const cells = territoryMap[p.user_id] ?? 0
          const color = p.color || getPlayerColor(p.user_id)
          return (
            <div key={p.user_id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xs font-bold text-gray-400 w-4 text-center">{i + 1}</span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ background: color }}
              >
                {p.profiles?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {p.profiles?.username ?? 'Anonymous'}
                </p>
                <p className="text-[10px] text-gray-500">{cells} cells</p>
              </div>
              {i === 0 && cells > 0 && <span className="text-blue-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.25A1.5 1.5 0 0113.5 6h1.25a.75.75 0 01.75.75v1.25a1.5 1.5 0 012.25 1.5v6a2 2 0 01-2 2h-11a2 2 0 01-2-2v-6A1.5 1.5 0 014.5 8.75V7.5a.75.75 0 01.75-.75H6.5A1.5 1.5 0 018 4V2.75A.75.75 0 0110 2zm1 6v1h1V8h-1zm-3 1H7v1h1V9zm3 2h-1v1h1v-1z" clipRule="evenodd"></path></svg></span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}