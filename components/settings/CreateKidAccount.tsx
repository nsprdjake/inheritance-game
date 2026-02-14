'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Kid } from '@/lib/types/database'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  kid: Kid
  familyId: string
  onSuccess: () => void
}

export default function CreateKidAccount({ kid, familyId, onSuccess }: Props) {
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const hasAccount = !!kid.user_id

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    setLoading(true)

    try {
      // Create auth user with email-like format (username@family.lyne)
      const email = `${username.toLowerCase().replace(/\s+/g, '')}@family.lyne`
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            kid_id: kid.id,
            family_id: familyId,
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          family_id: familyId,
          role: 'kid',
          kid_id: kid.id,
          email,
        })

      if (userError) {
        // If user record creation fails, we should clean up the auth user
        console.error('User record creation failed:', userError)
        throw new Error('Failed to create user profile')
      }

      // Link kid to user account
      const { error: kidUpdateError } = await supabase
        .from('kids')
        .update({ user_id: authData.user.id })
        .eq('id', kid.id)

      if (kidUpdateError) throw kidUpdateError

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  if (hasAccount) {
    return (
      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
        <div className="text-2xl">✅</div>
        <div className="flex-1">
          <p className="text-green-400 font-medium">Account Active</p>
          <p className="text-sm text-green-400/70">{kid.name} can log in</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center"
      >
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-green-400 font-bold mb-1">Account Created!</p>
        <p className="text-sm text-white/70">{kid.name} can now log in</p>
      </motion.div>
    )
  }

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        variant="secondary"
        className="w-full"
      >
        Create Login Account for {kid.name}
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <Card className="bg-white/5">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">
              Create Account for {kid.name}
            </h4>
            <p className="text-sm text-white/60 mb-4">
              {kid.name} will use this username and password to log in
            </p>
          </div>

          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g., maverick2024"
            required
            autoComplete="off"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-400">
              💡 <strong>Login credentials for {kid.name}:</strong>
              <br />
              Username: <span className="font-mono">{username || '(enter above)'}</span>
              <br />
              They'll use these to log in on their own device
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowForm(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
