import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import RoomClient from './RoomClient'

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .single()

  if (!room) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, total_captured_area')
    .eq('id', user.id)
    .single()

  // Auto-join the room
  await supabase
    .from('room_participants')
    .upsert({
      room_id: id,
      user_id: user.id,
    }, { onConflict: 'room_id,user_id', ignoreDuplicates: true })

  // Get participant color
  const { data: participant } = await supabase
    .from('room_participants')
    .select('color')
    .eq('room_id', id)
    .eq('user_id', user.id)
    .single()

  return (
    <div className="h-full flex flex-col">
      <Header
        username={profile?.username ?? user.email?.split('@')[0] ?? 'Anonymous'}
        totalArea={profile?.total_captured_area ?? 0}
        roomId={id}
        inviteCode={room.invite_code}
      />
      <main className="flex-1 overflow-hidden">
        <RoomClient
          room={room}
          userId={user.id}
          userColor={participant?.color ?? '#7C3AED'}
        />
      </main>
    </div>
  )
}
