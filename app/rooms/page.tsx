import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import RoomsClient from './RoomsClient'

export default async function RoomsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, total_captured_area')
    .eq('id', user.id)
    .single()

  return (
    <div className="h-full flex flex-col">
      <Header
        username={profile?.username ?? user.email?.split('@')[0]}
        totalArea={profile?.total_captured_area ?? 0}
      />
      <main className="flex-1 overflow-hidden">
        <RoomsClient userId={user.id} />
      </main>
      <BottomNav />
    </div>
  )
}
