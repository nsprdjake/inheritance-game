import { useState } from 'react'
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

export default function Step2AddKids({ data, updateData, onNext, onBack }: Props) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')

  const addKid = () => {
    if (name.trim() && age) {
      updateData({
        kids: [...data.kids, { name: name.trim(), age: parseInt(age) }]
      })
      setName('')
      setAge('')
    }
  }

  const removeKid = (index: number) => {
    updateData({
      kids: data.kids.filter((_, i) => i !== index)
    })
  }

  const handleNext = () => {
    if (data.kids.length > 0) {
      onNext()
    }
  }

  return (
    <Card className="animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Add Your Kids 👨‍👩‍👧‍👦
        </h2>
        <p className="text-white/60">
          Who will be earning points?
        </p>
      </div>

      <div className="space-y-6">
        {/* Add kid form */}
        <div className="flex gap-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addKid()
              }
            }}
          />
          <Input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-24"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addKid()
              }
            }}
          />
          <Button
            type="button"
            onClick={addKid}
            variant="secondary"
          >
            Add
          </Button>
        </div>

        {/* Kids list */}
        {data.kids.length > 0 && (
          <div className="space-y-2">
            {data.kids.map((kid, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div>
                  <p className="font-semibold text-white">{kid.name}</p>
                  <p className="text-sm text-white/60">{kid.age} years old</p>
                </div>
                <button
                  onClick={() => removeKid(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {data.kids.length === 0 && (
          <div className="text-center py-8 text-white/40">
            Add at least one kid to continue
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={data.kids.length === 0}
          >
            Next →
          </Button>
        </div>
      </div>
    </Card>
  )
}
