import { OnboardingData } from '@/app/onboarding/page'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface Props {
  data: OnboardingData
  onBack: () => void
  onComplete: () => void
  loading: boolean
}

export default function Step4Review({ data, onBack, onComplete, loading }: Props) {
  const themes = {
    modern: { name: 'Modern', emoji: '✨' },
    pirates: { name: 'Pirates', emoji: '🏴‍☠️' },
    space: { name: 'Space', emoji: '🚀' },
    medieval: { name: 'Medieval', emoji: '🏰' },
  }

  const selectedTheme = themes[data.theme as keyof typeof themes] || themes.modern

  return (
    <Card className="animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Review & Launch 🚀
        </h2>
        <p className="text-white/60">
          Everything looks good?
        </p>
      </div>

      <div className="space-y-6">
        {/* Family info */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 mb-2">Family Name</h3>
          <p className="text-xl font-bold text-white">{data.familyName}</p>
        </div>

        {/* Kids */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Kids</h3>
          <div className="space-y-2">
            {data.kids.map((kid, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-white">{kid.name}</span>
                <span className="text-white/60 text-sm">{kid.age} years old</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Settings</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Theme</span>
              <span className="text-white">
                {selectedTheme.emoji} {selectedTheme.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Small Task</span>
              <span className="text-white">{data.pointValues.small} points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Medium Task</span>
              <span className="text-white">{data.pointValues.medium} points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Large Task</span>
              <span className="text-white">{data.pointValues.large} points</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Conversion Rate</span>
              <span className="text-white">
                100 points = ${(100 * data.conversionRate).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack} disabled={loading}>
            ← Back
          </Button>
          <Button onClick={onComplete} disabled={loading}>
            {loading ? 'Setting up...' : 'Complete Setup ✨'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
