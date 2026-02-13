import { OnboardingData } from '@/app/onboarding/page'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}

const themes = [
  { id: 'modern', name: 'Modern', emoji: '✨' },
  { id: 'pirates', name: 'Pirates', emoji: '🏴‍☠️' },
  { id: 'space', name: 'Space', emoji: '🚀' },
  { id: 'medieval', name: 'Medieval', emoji: '🏰' },
]

export default function Step3Settings({ data, updateData, onNext, onBack }: Props) {
  return (
    <Card className="animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Configure Your System ⚙️
        </h2>
        <p className="text-white/60">
          Customize how points work
        </p>
      </div>

      <div className="space-y-6">
        {/* Theme selection */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">
            Choose a Theme
          </label>
          <div className="grid grid-cols-2 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => updateData({ theme: theme.id })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  data.theme === theme.id
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-3xl mb-1">{theme.emoji}</div>
                <div className="text-sm font-semibold">{theme.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Point values */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">
            Default Point Values
          </label>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Small Task"
              type="number"
              value={data.pointValues.small}
              onChange={(e) => updateData({
                pointValues: { ...data.pointValues, small: parseInt(e.target.value) || 0 }
              })}
              min="1"
            />
            <Input
              label="Medium Task"
              type="number"
              value={data.pointValues.medium}
              onChange={(e) => updateData({
                pointValues: { ...data.pointValues, medium: parseInt(e.target.value) || 0 }
              })}
              min="1"
            />
            <Input
              label="Large Task"
              type="number"
              value={data.pointValues.large}
              onChange={(e) => updateData({
                pointValues: { ...data.pointValues, large: parseInt(e.target.value) || 0 }
              })}
              min="1"
            />
          </div>
        </div>

        {/* Conversion rate */}
        <div>
          <Input
            label="Points to Dollars Conversion (e.g., 0.01 = 100 points = $1)"
            type="number"
            step="0.01"
            value={data.conversionRate}
            onChange={(e) => updateData({ conversionRate: parseFloat(e.target.value) || 0 })}
            min="0"
          />
          <p className="mt-2 text-xs text-white/40">
            {data.pointValues.small} points = ${(data.pointValues.small * data.conversionRate).toFixed(2)}
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button onClick={onNext}>
            Next →
          </Button>
        </div>
      </div>
    </Card>
  )
}
