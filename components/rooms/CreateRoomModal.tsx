'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreateRoomModalProps {
  onClose: () => void
  onCreated: (roomId: string) => void
  userId: string
}

const DURATION_OPTIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '6 Hours', hours: 6 },
  { label: '24 Hours', hours: 24 },
  { label: '3 Days', hours: 72 },
  { label: '7 Days', hours: 168 },
]

export default function CreateRoomModal({ onClose, onCreated, userId }: CreateRoomModalProps) {
  const [name, setName] = useState('')
  const [duration, setDuration] = useState(24)
  const [maxPlayers, setMaxPlayers] = useState(10)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: name.trim(),
          created_by: userId,
          expires_at: expiresAt,
          max_players: maxPlayers,
          status: 'active',
        })
        .select('id')
        .single()

      if (error) {
        setError(error.message)
        return
      }
      if (data) onCreated(data.id)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl border border-gray-200"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Create Room
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Room Name */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="Downtown Domination"
              maxLength={50}
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Match Duration</label>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setDuration(opt.hours)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                    duration === opt.hours
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block flex justify-between">
              <span>Max Players</span>
              <span className="text-blue-600 font-bold">{maxPlayers}</span>
            </label>
            <input
              type="range"
              min={2}
              max={50}
              value={maxPlayers}
              onChange={e => setMaxPlayers(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>2</span><span>50</span>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2 border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Creating...' : 'Launch Room'}
          </button>
        </form>
      </div>
    </div>
  )
}
