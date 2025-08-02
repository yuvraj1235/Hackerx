// components/AuthButton.tsx
'use client'

import { createClient } from '@/utils/superbase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthButton() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null) // Or use a proper User type from Supabase

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      console.log('AuthButton mounted, user:', session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })


    

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`, // This must be an Authorized Redirect URI in Google Cloud and Supabase
      },
    })

    if (error) {
      console.error('Error signing in with Google:', error.message)
      // Handle error, e.g., show a toast notification
    } else if (data.url) {
      // Redirect to Google's authentication page
      router.push(data.url)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      router.push('/') // Redirect to home or login page after sign out
    } else {
      console.error('Error signing out:', error.message)
    }
  }

  return (
    <div>
      {user ? (
        <div className="flex items-center space-x-4">
          <p className="text-gray-700">Welcome, <span className="font-semibold">{user.email}</span></p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition duration-300"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleGoogleSignIn}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
        >
          Sign In with Google
        </button>
      )}
    </div>
  )
}