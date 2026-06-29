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
  currentUserId: string
}

export default function LeaderBoard({ roomId, currentUserId }: LeaderBoardProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [territoryMap, setTerritoryMap] = useState<Record<string, number>>({})
  const [friends, setFriends] = useState<Set<string>>(new Set())
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
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

      const { data: frs } = await supabase
        .from('friend_requests')
        .select('sender_id, receiver_id, status')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)

      if (frs) {
        const fSet = new Set<string>()
        const rSet = new Set<string>()
        frs.forEach(r => {
          const otherId = r.sender_id === currentUserId ? r.receiver_id : r.sender_id
          if (r.status === 'accepted') fSet.add(otherId)
          else if (r.sender_id === currentUserId && r.status === 'pending') rSet.add(otherId)
        })
        setFriends(fSet)
        setSentRequests(rSet)
      }
    }
    load()

    const sub = supabase
      .channel(`lb-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'territories', filter: `room_id=eq.${roomId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` }, load)
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [roomId, currentUserId])

  const sorted = [...participants].sort(
    (a, b) => (territoryMap[b.user_id] ?? 0) - (territoryMap[a.user_id] ?? 0)
  )

  const handleAddFriend = async (targetId: string) => {
    setSentRequests(prev => new Set(prev).add(targetId))
    await supabase.from('friend_requests').insert({
      sender_id: currentUserId,
      receiver_id: targetId,
      status: 'pending'
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 h-full overflow-hidden flex flex-col shadow-lg">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        <span>Players</span>
        <span className="ml-auto text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{participants.length} players</span>
      </h3>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sorted.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <p className="text-xs text-gray-400">No players yet</p>
          </div>
        )}
        {sorted.map((p) => {
          const color = p.color || getPlayerColor(p.user_id)
          return (
            <div key={p.user_id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-gray-50 border border-gray-100">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {p.profiles?.username ?? p.user_id}
                </p>
              </div>
              {p.user_id !== currentUserId && !friends.has(p.user_id) && (
                <button
                  disabled={sentRequests.has(p.user_id)}
                  onClick={() => handleAddFriend(p.user_id)}
                  className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                    sentRequests.has(p.user_id)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {sentRequests.has(p.user_id) ? 'Sent' : 'Add Friend'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}