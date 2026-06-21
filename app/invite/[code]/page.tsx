import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const supabase = await createClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('id, status, expires_at')
    .eq('invite_code', code)
    .single()

  if (!room) {
    redirect('/?error=invalid_invite')
  }

  const expired = new Date(room.expires_at) < new Date()
  if (expired || room.status === 'completed') {
    redirect('/?error=room_expired')
  }

  redirect(`/rooms/${room.id}`)
}
