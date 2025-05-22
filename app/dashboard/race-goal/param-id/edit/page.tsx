// /app/dashboard/race-goal/param-id/edit/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditRaceGoalPage() {
  const router = useRouter()
  const params = useParams()
  const id = params['param-id'] as string

  const [goal, setGoal] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchGoal = async () => {
      const stravaId = localStorage.getItem('strava_id')
      if (!stravaId) return setError('ログイン情報が見つかりません')

      const res = await fetch(`/api/race-goal`, {
        headers: { 'x-strava-id': stravaId }
      })
      const json = await res.json()
      const found = json.data.find((g: any) => g.id === id)

      if (!found) {
        setError('目標が見つかりません')
      } else {
        setGoal(found)
      }
      setLoading(false)
    }

    fetchGoal()
  }, [id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const body = {
      race_name: formData.get('race_name'),
      race_date: formData.get('race_date'),
      swim_distance_km: parseFloat(formData.get('swim_distance_km') as string),
      bike_distance_km: parseFloat(formData.get('bike_distance_km') as string),
      run_distance_km: parseFloat(formData.get('run_distance_km') as string),
      target_total_time: formData.get('target_total_time') || null,
      is_a_race: formData.get('is_a_race') === 'on',
      training_time_weekday_hr: parseFloat(formData.get('training_time_weekday_hr') as string),
      training_time_weekend_hr: parseFloat(formData.get('training_time_weekend_hr') as string),
      motivation: formData.get('motivation') || null
    }

    const stravaId = localStorage.getItem('strava_id')
    const res = await fetch(`/api/race-goal/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-strava-id': stravaId || ''
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      router.push('/dashboard/race-goal')
    } else {
      const err = await res.json()
      setError(err.error || '更新に失敗しました')
      setSaving(false)
    }
  }

  if (loading) return <p className="p-6">読み込み中...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>
  if (!goal) return null

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">✏️ 目標レースの編集</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          レース名
          <input name="race_name" type="text" defaultValue={goal.race_name} required className="w-full border p-2" />
        </label>

        <label className="block">
          レース日
          <input name="race_date" type="date" defaultValue={goal.race_date} required className="w-full border p-2" />
        </label>

        <label className="block">
          スイム距離（km）
          <input name="swim_distance_km" type="number" step="0.1" defaultValue={goal.swim_distance_km} required className="w-full border p-2" />
        </label>

        <label className="block">
          バイク距離（km）
          <input name="bike_distance_km" type="number" step="0.1" defaultValue={goal.bike_distance_km} required className="w-full border p-2" />
        </label>

        <label className="block">
          ラン距離（km）
          <input name="run_distance_km" type="number" step="0.1" defaultValue={goal.run_distance_km} required className="w-full border p-2" />
        </label>

        <label className="block">
          目標タイム（HH:MM:SS形式・任意）
          <input name="target_total_time" type="text" defaultValue={goal.target_total_time || ''} className="w-full border p-2" />
        </label>

        <label className="flex items-center space-x-2">
          <input name="is_a_race" type="checkbox" defaultChecked={goal.is_a_race} />
          <span>Aレースとして設定する</span>
        </label>

        <label className="block">
          平日のトレーニング時間（時間）
          <input name="training_time_weekday_hr" type="number" step="0.1" defaultValue={goal.training_time_weekday_hr} required className="w-full border p-2" />
        </label>

        <label className="block">
          週末のトレーニング時間（時間）
          <input name="training_time_weekend_hr" type="number" step="0.1" defaultValue={goal.training_time_weekend_hr} required className="w-full border p-2" />
        </label>

        <label className="block">
          モチベーション（任意）
          <textarea name="motivation" rows={3} defaultValue={goal.motivation || ''} className="w-full border p-2" />
        </label>

        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {saving ? '更新中...' : '更新する'}
        </button>
      </form>
    </main>
  )
}
