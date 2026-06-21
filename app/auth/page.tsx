import AuthForm from '@/components/auth/AuthForm'

export default function AuthPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="min-h-full w-full max-w-sm mx-auto flex flex-col items-center justify-center py-10 px-4">
        <div className="text-center mb-8 w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Walkie</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the arena</p>
        </div>
        <div className="w-full">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
