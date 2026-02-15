'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Family, Kid, FamilySettings } from '@/lib/types/database'
import Link from 'next/link'
import CreateKidAccount from './CreateKidAccount'
import ThemeSelector from '@/components/ui/ThemeSelector'

interface Props {
  family: Family | null
  kids: Kid[]
  settings: FamilySettings | null
  familyId: string
}

export default function SettingsClient({ family, kids, settings, familyId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Family name
  const [familyName, setFamilyName] = useState(family?.name || '')
  const [pointValues, setPointValues] = useState({
    small: settings?.point_values?.small || 10,
    medium: settings?.point_values?.medium || 25,
    large: settings?.point_values?.large || 50,
  })
  const [conversionRate, setConversionRate] = useState(settings?.conversion_rate || 0.01)

  // Kids management
  const [kidsList, setKidsList] = useState(kids)
  const [newKidName, setNewKidName] = useState('')
  const [newKidAge, setNewKidAge] = useState('')
  const [editingKid, setEditingKid] = useState<string | null>(null)
  const [editKidName, setEditKidName] = useState('')
  const [editKidAge, setEditKidAge] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSaveSettings = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Update family name
      if (familyName !== family?.name) {
        const { error: familyError } = await supabase
          .from('families')
          .update({ name: familyName })
          .eq('id', familyId)

        if (familyError) throw familyError
      }

      // Update settings
      const { error: settingsError } = await supabase
        .from('family_settings')
        .update({
          point_values: pointValues,
          conversion_rate: conversionRate,
        })
        .eq('family_id', familyId)

      if (settingsError) throw settingsError

      setSuccess('Settings saved successfully!')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAddKid = async () => {
    if (!newKidName.trim() || !newKidAge) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('kids')
        .insert({
          family_id: familyId,
          name: newKidName.trim(),
          age: parseInt(newKidAge),
        })
        .select()
        .single()

      if (error) throw error

      setKidsList([...kidsList, data])
      setNewKidName('')
      setNewKidAge('')
      setSuccess('Kid added successfully!')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to add kid')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateKid = async (kidId: string) => {
    if (!editKidName.trim()) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('kids')
        .update({
          name: editKidName.trim(),
          age: editKidAge ? parseInt(editKidAge) : null,
        })
        .eq('id', kidId)

      if (error) throw error

      setKidsList(kidsList.map(k => 
        k.id === kidId 
          ? { ...k, name: editKidName.trim(), age: editKidAge ? parseInt(editKidAge) : k.age }
          : k
      ))
      setEditingKid(null)
      setSuccess('Kid updated successfully!')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update kid')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKid = async (kidId: string) => {
    if (!confirm('Are you sure you want to remove this kid? This will also delete all their transactions.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('kids')
        .delete()
        .eq('id', kidId)

      if (error) throw error

      setKidsList(kidsList.filter(k => k.id !== kidId))
      setSuccess('Kid removed successfully!')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to remove kid')
    } finally {
      setLoading(false)
    }
  }

  const startEditingKid = (kid: Kid) => {
    setEditingKid(kid.id)
    setEditKidName(kid.name)
    setEditKidAge(kid.age?.toString() || '')
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Settings ⚙️
            </h1>
            <p className="text-white/60">Customize your family's experience</p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary">← Back to Dashboard</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
            {success}
          </div>
        )}

        {/* Family Settings */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Family Settings</h2>
          <div className="space-y-4">
            <Input
              label="Family Name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="The Smith Family"
            />
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="mb-6">
          <ThemeSelector />
        </Card>

        {/* Point Values */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Point Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Small Task"
              type="number"
              value={pointValues.small}
              onChange={(e) => setPointValues({ ...pointValues, small: parseInt(e.target.value) || 0 })}
              min="1"
            />
            <Input
              label="Medium Task"
              type="number"
              value={pointValues.medium}
              onChange={(e) => setPointValues({ ...pointValues, medium: parseInt(e.target.value) || 0 })}
              min="1"
            />
            <Input
              label="Large Task"
              type="number"
              value={pointValues.large}
              onChange={(e) => setPointValues({ ...pointValues, large: parseInt(e.target.value) || 0 })}
              min="1"
            />
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Points to Dollars</h2>
          <Input
            label="Conversion Rate (e.g., 0.01 = 100 points = $1)"
            type="number"
            step="0.01"
            value={conversionRate}
            onChange={(e) => setConversionRate(parseFloat(e.target.value) || 0)}
            min="0"
          />
          <p className="mt-2 text-sm text-white/40">
            Example: {pointValues.small} points = ${(pointValues.small * conversionRate).toFixed(2)}
          </p>
        </Card>

        {/* Save Settings Button */}
        <div className="mb-6">
          <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Kids Management */}
        <Card>
          <h2 className="text-2xl font-bold text-white mb-4">Manage Kids</h2>
          
          {/* Add new kid */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Add New Kid</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Name"
                value={newKidName}
                onChange={(e) => setNewKidName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Age"
                value={newKidAge}
                onChange={(e) => setNewKidAge(e.target.value)}
                className="w-24"
              />
              <Button onClick={handleAddKid} disabled={loading}>
                Add
              </Button>
            </div>
          </div>

          {/* Existing kids */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-3">Existing Kids</h3>
            {kidsList.map((kid) => (
              <div
                key={kid.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                {editingKid === kid.id ? (
                  <div className="flex gap-3 items-end">
                    <Input
                      value={editKidName}
                      onChange={(e) => setEditKidName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={editKidAge}
                      onChange={(e) => setEditKidAge(e.target.value)}
                      className="w-24"
                    />
                    <Button onClick={() => handleUpdateKid(kid.id)} size="sm">
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingKid(null)} size="sm">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">{kid.name}</p>
                        <p className="text-sm text-white/60">{kid.age} years old</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingKid(kid)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteKid(kid.id)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* Kid account creation */}
                    <CreateKidAccount 
                      kid={kid} 
                      familyId={familyId}
                      onSuccess={() => router.refresh()}
                    />
                  </div>
                )}
              </div>
            ))}
            {kidsList.length === 0 && (
              <p className="text-center text-white/40 py-4">No kids added yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
