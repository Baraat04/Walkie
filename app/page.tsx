import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthForm from '@/components/auth/AuthForm'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/rooms')

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="min-h-full w-full max-w-sm mx-auto flex flex-col items-center justify-center py-10 px-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-gray-200 shadow-sm mb-8 text-center">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
          <span className="text-xs text-gray-600 font-medium">Real-time multiplayer &bull; Live GPS</span>
        </div>

        {/* Logo */}
        <div className="text-center mb-8 w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path>
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
             </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Walkie</h1>
          <p className="text-gray-500 text-base font-medium max-w-xs mx-auto leading-snug">
            Walk the streets. Capture territory. Dominate your city.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 w-full mb-10">
          {[
            { icon: <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>, label: 'GPS Capture' },
            { icon: <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>, label: 'Fight Rooms' },
            { icon: <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>, label: 'Leaderboards' },
          ].map(f => (
            <div key={f.label} className="bg-white rounded-2xl p-3 text-center border border-gray-200 shadow-sm text-gray-700 flex flex-col items-center justify-center">
              <div className="mb-1">{f.icon}</div>
              <div className="text-[10px] sm:text-[11px] text-gray-500 font-medium whitespace-nowrap">{f.label}</div>
            </div>
          ))}
        </div>

        {/* Auth */}
        <div className="w-full mb-8">
          <AuthForm />
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-gray-400 mt-4">
          &copy; 2026 Walkie &mdash; Territory Capture Game
        </div>
      </div>
    </div>
  )
}
