import { OnboardingData } from '@/app/onboarding/page'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface Props {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  onNext: () => void
}

export default function Step1FamilyInfo({ data, updateData, onNext }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.familyName.trim()) {
      onNext()
    }
  }

  return (
    <Card className="animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Welcome to Inheritance Game! 🎮
        </h2>
        <p className="text-white/60">
          Let's set up your family's point system
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="What's your family name?"
          type="text"
          value={data.familyName}
          onChange={(e) => updateData({ familyName: e.target.value })}
          placeholder="The Smith Family"
          required
          autoFocus
        />

        <div className="flex justify-end">
          <Button type="submit">
            Next →
          </Button>
        </div>
      </form>
    </Card>
  )
}
