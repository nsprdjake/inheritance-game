import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Achievement {
  id: string
  achievement_type: string
  title: string
  description?: string
  icon?: string
  unlocked_at: string
}

export function useAchievementNotifications(kidId: string) {
  const [latestAchievement, setLatestAchievement] = useState<Achievement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!kidId) return

    // Subscribe to new achievements
    const channel = supabase
      .channel(`achievements:${kidId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievements',
          filter: `kid_id=eq.${kidId}`
        },
        (payload) => {
          const newAchievement = payload.new as Achievement
          setLatestAchievement(newAchievement)
          
          // Auto-clear after showing
          setTimeout(() => {
            setLatestAchievement(null)
          }, 5000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [kidId, supabase])

  const clearAchievement = () => {
    setLatestAchievement(null)
  }

  return { latestAchievement, clearAchievement }
}
