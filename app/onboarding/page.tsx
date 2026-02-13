'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Step1FamilyInfo from '@/components/onboarding/Step1FamilyInfo'
import Step2AddKids from '@/components/onboarding/Step2AddKids'
import Step3Settings from '@/components/onboarding/Step3Settings'
import Step4Review from '@/components/onboarding/Step4Review'

export interface OnboardingData {
  familyName: string
  kids: Array<{ name: string; age: number; avatar?: string }>
  theme: string
  themeColors: { primary: string; secondary: string }
  pointValues: { small: number; medium: number; large: number }
  conversionRate: number
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [data, setData] = useState<OnboardingData>({
    familyName: '',
    kids: [],
    theme: 'modern',
    themeColors: { primary: '#6366f1', secondary: '#ec4899' },
    pointValues: { small: 10, medium: 25, large: 50 },
    conversionRate: 0.01,
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: data.familyName })
        .select()
        .single()

      if (familyError) throw familyError

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          family_id: family.id,
          role: 'admin',
          email: user.email,
        })

      if (userError) throw userError

      // Create kids
      for (const kid of data.kids) {
        const { error: kidError } = await supabase
          .from('kids')
          .insert({
            family_id: family.id,
            name: kid.name,
            age: kid.age,
            avatar: kid.avatar,
          })

        if (kidError) throw kidError
      }

      // Create family settings
      const { error: settingsError } = await supabase
        .from('family_settings')
        .insert({
          family_id: family.id,
          theme: data.theme,
          theme_colors: data.themeColors,
          point_values: data.pointValues,
          conversion_rate: data.conversionRate,
        })

      if (settingsError) throw settingsError

      // Redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setError(err.message || 'Failed to complete onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full mx-1 transition-all ${
                  step <= currentStep
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-white/60 text-sm">
            Step {currentStep} of 4
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {/* Steps */}
        <div className="animate-fade-in">
          {currentStep === 1 && (
            <Step1FamilyInfo
              data={data}
              updateData={updateData}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <Step2AddKids
              data={data}
              updateData={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && (
            <Step3Settings
              data={data}
              updateData={updateData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <Step4Review
              data={data}
              onBack={prevStep}
              onComplete={handleComplete}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
