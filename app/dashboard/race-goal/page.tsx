// /app/dashboard/race-goal/page.tsx

'use client'

import { useEffect, useState } from 'react'

type RaceGoal = {
  id: string
  race_name: string
  race_date: string
  is_a_race: boolean
  target_total_time?: string
}

export default function RaceGoalListPage() {
  const [goals, setGoals] = useState<RaceGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const stravaId = localStorage.getItem('strava_id')
      if (!stravaId) {
        setError('ログイン情報が見つかりません')
        setLoading(false)
        return
      }

      const res = await fetch('/api/race-goal', {
        headers: { 'x-strava-id': stravaId }
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '目標一覧の取得に失敗しました')
      }

      const json = await res.json()
      setGoals(json.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('この目標を削除しますか？')
    if (!confirmed) return

    const stravaId = localStorage.getItem('strava_id')
    const res = await fetch(`/api/race-goal/${id}`, {
      method: 'DELETE',
      headers: { 'x-strava-id': stravaId || '' }
    })

    if (res.ok) {
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } else {
      const err = await res.json()
      alert('削除に失敗しました: ' + (err.error || '不明なエラー'))
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏁 登録済みの目標レース</h1>

      {loading && <p>読み込み中...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && goals.length === 0 && <p>目標はまだ登録されていません。</p>}

      <table className="min-w-full border mt-4 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-3 py-2 border">レース名</th>
            <th className="px-3 py-2 border">日付</th>
            <th className="px-3 py-2 border">Aレース</th>
            <th className="px-3 py-2 border">目標タイム</th>
            <th className="px-3 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {goals.map((goal) => (
            <tr key={goal.id} className="hover:bg-gray-50">
              <td className="border px-3 py-2">{goal.race_name}</td>
              <td className="border px-3 py-2">{goal.race_date}</td>
              <td className="border px-3 py-2 text-center">{goal.is_a_race ? '⭐' : ''}</td>
              <td className="border px-3 py-2">{goal.target_total_time || '-'}</td>
              <td className="border px-3 py-2">
                <a href={`/dashboard/race-goal/${goal.id}/edit`} className="text-blue-600 underline mr-2">編集</a>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="text-red-600 underline"
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
