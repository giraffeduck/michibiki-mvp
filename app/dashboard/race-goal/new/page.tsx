// /app/dashboard/race-goal/new/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewRaceGoalPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    // goal_type[] を配列で取得
    const selectedGoalTypes = formData.getAll('goal_type').map(String)

    const body = {
      race_name: formData.get('race_name'),
      race_date: formData.get('race_date'),
      swim_distance_km: parseFloat(formData.get('swim_distance_km') as string),
      bike_distance_km: parseFloat(formData.get('bike_distance_km') as string),
      run_distance_km: parseFloat(formData.get('run_distance_km') as string),
      target_total_time: formData.get('target_total_time') || null,
      target_swim_time: formData.get('target_swim_time') || null,
      target_bike_time: formData.get('target_bike_time') || null,
      target_run_time: formData.get('target_run_time') || null,
      target_rank: formData.get('target_rank') || null,
      goal_type: selectedGoalTypes.length > 0 ? selectedGoalTypes : null,
      is_a_race: formData.get('is_a_race') === 'on',
      motivation: formData.get('motivation') || null,
      training_time_weekday_hr: parseFloat(formData.get('training_time_weekday_hr') as string),
      training_time_weekend_hr: parseFloat(formData.get('training_time_weekend_hr') as string),
      training_limit_comment: formData.get('training_limit_comment') || null
    }

    const stravaId = localStorage.getItem('strava_id')
    if (!stravaId) {
      setError('ログイン情報が見つかりません')
      setLoading(false)
      return
    }

    const res = await fetch('/api/race-goal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-strava-id': stravaId
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || '登録に失敗しました')
      setLoading(false)
      return
    }

    router.push('/dashboard/race-goal')
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🎯 目標レースの登録</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 必須項目 */}
        <div>
          <label className="block font-medium mb-1">レース名</label>
          <input name="race_name" type="text" required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">レース日</label>
          <input name="race_date" type="date" required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">スイム距離（km）</label>
          <input name="swim_distance_km" type="number" step="0.1" required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">バイク距離（km）</label>
          <input name="bike_distance_km" type="number" step="0.1" required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">ラン距離（km）</label>
          <input name="run_distance_km" type="number" step="0.1" required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">平日のトレーニング時間（時間）</label>
          <input name="training_time_weekday_hr" type="number" step="0.1" required className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">週末のトレーニング時間（時間）</label>
          <input name="training_time_weekend_hr" type="number" step="0.1" required className="w-full border p-2 rounded" />
        </div>

        <div className="flex items-center space-x-2">
          <input name="is_a_race" type="checkbox" />
          <span className="text-sm">Aレースとして設定する</span>
        </div>

        {/* 任意項目 */}
        <div>
          <label className="block font-medium mb-1">目標タイム（HH:MM:SS）</label>
          <input name="target_total_time" type="text" placeholder="例：08:45:00" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">スイム目標タイム（任意）</label>
          <input name="target_swim_time" type="text" placeholder="例：00:55:00" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">バイク目標タイム（任意）</label>
          <input name="target_bike_time" type="text" placeholder="例：04:50:00" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">ラン目標タイム（任意）</label>
          <input name="target_run_time" type="text" placeholder="例：03:00:00" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">目標順位（任意）</label>
          <input name="target_rank" type="number" placeholder="例：20（エイジ内）" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">目標タイプ（複数選択可）</label>
          <div className="space-y-1 pl-2">
            <label className="block"><input type="checkbox" name="goal_type" value="完走" /> 完走</label>
            <label className="block"><input type="checkbox" name="goal_type" value="自己ベスト" /> 自己ベスト</label>
            <label className="block"><input type="checkbox" name="goal_type" value="表彰台" /> 表彰台</label>
            <label className="block"><input type="checkbox" name="goal_type" value="KONA" /> KONAスロット</label>
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">モチベーション（任意）</label>
          <textarea name="motivation" rows={3} placeholder="例：KONAを目指して本気で挑戦中" className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-medium mb-1">生活・仕事の制約（任意）</label>
          <textarea name="training_limit_comment" rows={2} placeholder="例：毎週金曜夜は練習できない" className="w-full border p-2 rounded" />
        </div>

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {loading ? '登録中...' : '登録する'}
        </button>
      </form>
    </main>
  )
}
