'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default function KidLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Convert username to email format
      const email = `${username.toLowerCase().replace(/\s+/g, '')}@family.lyne`

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Wrong username or password')
        }
        throw signInError
      }

      if (!data.user) {
        throw new Error('Login failed')
      }

      // Verify this is a kid account
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, kid_id')
        .eq('id', data.user.id)
        .single()

      if (userError || userData?.role !== 'kid') {
        await supabase.auth.signOut()
        throw new Error('This login is for kids only. Parents use the main login page.')
      }

      // Redirect to kid dashboard
      router.push('/kid')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            🎮 LYNE Kids
          </h1>
          <p className="text-white/60 text-lg">Sign in to see your points!</p>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10">
              <p className="text-white/80">👋 Enter your username and password</p>
            </div>

            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              required
              autoComplete="username"
              className="text-lg"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="text-lg"
            />

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                <p className="font-medium">❌ {error}</p>
                {error.includes('username or password') && (
                  <p className="text-sm mt-2 text-red-400/80">
                    Ask your parent to check your login info!
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg py-6"
            >
              {loading ? 'Signing in...' : 'Sign In 🚀'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/60 mb-3">
              Don't have an account? Ask your parent to create one for you!
            </p>
            <Link 
              href="/auth/login" 
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ← Parent Login
            </Link>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-white/40">
            🔒 Safe and secure • Made for families
          </p>
        </div>
      </div>
    </div>
  )
}
