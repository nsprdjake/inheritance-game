'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            LYNE
          </h1>
          <p className="text-white/60">Reset your password</p>
        </div>

        <Card>
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="text-xl font-semibold text-white">Check your email</h2>
              <p className="text-white/60">
                If an account exists with that email, we've sent you a link to reset your password.
              </p>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button variant="secondary" className="w-full">
                    ← Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div>
                  <p className="text-white/60 text-sm mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-white/60">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Back to login
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
