'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RoomCard from '@/components/rooms/RoomCard'
import CreateRoomModal from '@/components/rooms/CreateRoomModal'

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

export default function RoomsClient({ userId }: { userId: string }) {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const supabase = createClient()

  const loadRooms = async () => {
    let query = supabase
      .from('rooms')
      .select('*, room_participants(count)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter === 'active') {
      query = query.eq('status', 'active').gt('expires_at', new Date().toISOString())
    }

    const { data } = await query
    if (data) {
      const enriched = data.map(r => ({
        ...r,
        participant_count: (r.room_participants as { count: number }[])?.[0]?.count ?? 0,
      }))
      setRooms(enriched)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadRooms()
    const sub = supabase
      .channel('rooms-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, loadRooms)
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [filter])

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Sub header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 flex-shrink-0 shadow-sm">
          {(['active', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 capitalize flex items-center gap-1.5 ${
                filter === f
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'active' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Live
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg> All
                </>
              )}
            </button>
          ))}
        </div>

        <button
          id="create-room-btn"
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          <span>New</span>
        </button>
      </div>

      {/* Rooms list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading && (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 h-28 animate-pulse shadow-sm" />
            ))}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No rooms yet</h3>
            <p className="text-sm text-gray-500 mb-6">Create the first room and start capturing territory!</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg> Create Room
            </button>
          </div>
        )}

        {!loading && rooms.map(room => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      {showCreate && (
        <CreateRoomModal
          userId={userId}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false)
            router.push(`/rooms/${id}`)
          }}
        />
      )}
    </div>
  )
}
