'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface HeaderProps {
  username?: string
  totalArea?: number
  roomId?: string
  inviteCode?: string
}

export default function Header({ username, totalArea, roomId, inviteCode }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [copied, setCopied] = useState(false)
  const [showFriends, setShowFriends] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleInvite = async () => {
    const code = inviteCode
    if (!code) return
    const url = `${window.location.origin}/invite/${code}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 z-50 relative">
      {/* Logo */}
      <Link href="/rooms" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <span className="font-bold text-base text-gray-900 hidden sm:block tracking-tight">Walkie</span>
      </Link>

      {/* Center: stats */}
      {username && (
        <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
              {username[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">{username}</span>
          </div>
          {totalArea !== undefined && (
            <div className="bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200 hidden xs:flex items-center gap-1.5">
              <span className="text-gray-400 text-xs">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                 </svg>
              </span>
              <span className="text-xs text-gray-600 font-medium">{totalArea.toFixed(0)}m²</span>
            </div>
          )}
        </div>
      )}

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {inviteCode && (
          <button
            id="invite-btn"
            onClick={handleInvite}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              copied
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {copied ? 'Copied!' : 'Invite'}
          </button>
        )}

        <button
          id="friends-btn"
          onClick={() => setShowFriends(!showFriends)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <span className="hidden sm:inline">Friends</span>
        </button>

        {username && (
          <button
            onClick={handleSignOut}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>

      {/* Friends panel */}
      {showFriends && (
        <div className="absolute top-full right-4 mt-2 w-72 bg-white rounded-2xl border border-gray-200 p-4 z-50 shadow-xl">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Friends</h3>
          <div className="text-center py-6">
            <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <p className="text-xs text-gray-500">Friends feature coming soon</p>
            <p className="text-xs text-gray-400 mt-1">Share your invite link to play with friends!</p>
          </div>
        </div>
      )}
    </header>
  )
}
