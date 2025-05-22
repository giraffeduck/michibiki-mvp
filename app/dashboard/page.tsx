// /app/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Activity = {
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  start_date: string
}

type WeekOption = {
  label: string
  value: string
}

const getLastSixMondays = (): WeekOption[] => {
  const mondays: WeekOption[] = []
  const today = new Date()

  for (let i = 0; i < 6; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - date.getDay() + 1 - i * 7)
    const iso = date.toISOString().slice(0, 10)
    mondays.push({ label: `週の開始日: ${iso}`, value: iso })
  }

  return mondays
}

export default function DashboardPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [feedback, setFeedback] = useState<string>('読み込み中...')
  const [selectedWeek, setSelectedWeek] = useState<string>(getLastSixMondays()[0].value)
  const weekOptions = getLastSixMondays()

  const stravaId = 20828320 // TODO: localStorage対応へ移行予定

  useEffect(() => {
    const syncStrava = async () => {
      await fetch('/api/strava/sync', { method: 'POST' })
    }

    const fetchActivities = async () => {
      const start = selectedWeek
      const endDate = new Date(start)
      endDate.setDate(endDate.getDate() + 6)
      const end = endDate.toISOString().slice(0, 10)

      const res = await fetch(`/api/activities?strava_id=${stravaId}&start=${start}&end=${end}`)
      const data = await res.json()
      setActivities(data)
    }

    const fetchFeedbackFromSupabaseOrGenerate = async () => {
      const { data, error } = await supabase
        .from('feedback_log')
        .select('feedback_text')
        .eq('user_id', stravaId)
        .eq('week_start', selectedWeek)
        .single()

      if (error || !data) {
        console.warn('⚠️ 保存済みフィードバックなし → GPT生成へ')

        const res = await fetch(`/api/feedback?week=${selectedWeek}`, {
          method: 'POST',
        })

        if (!res.ok) {
          const errMsg = await res.text()
          console.error('❌ GPT生成失敗:', errMsg)
          setFeedback('')
          return
        }

        const text = await res.text()
        setFeedback(text)
      } else {
        setFeedback(data.feedback_text)
      }
    }

    syncStrava().then(() => {
      fetchActivities()
      fetchFeedbackFromSupabaseOrGenerate()
    })
  }, [selectedWeek])

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📊 ダッシュボード</h1>

      {/* アクティビティ一覧 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">🗓 今週のアクティビティ一覧</h2>

        <label htmlFor="week-select" className="mr-2">週を選択:</label>
        <select
          id="week-select"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {weekOptions.map((week) => (
            <option key={week.value} value={week.value}>
              {week.label}
            </option>
          ))}
        </select>

        {activities.length === 0 ? (
          <p className="mt-4 italic text-gray-500">今週はまだトレーニングが記録されていません。</p>
        ) : (
          <table className="mt-4 w-full border border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">日付</th>
                <th className="border px-2 py-1">種目</th>
                <th className="border px-2 py-1">距離 (km)</th>
                <th className="border px-2 py-1">時間 (分)</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((act) => (
                <tr key={act.id}>
                  <td className="border px-2 py-1">{new Date(act.start_date).toLocaleDateString()}</td>
                  <td className="border px-2 py-1">{act.type}</td>
                  <td className="border px-2 py-1">{(act.distance / 1000).toFixed(1)}</td>
                  <td className="border px-2 py-1">{Math.round(act.moving_time / 60)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* フィードバックコメント */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">💬 フィードバックコメント</h2>

        {feedback.trim() === '' || feedback === '読み込み中...' ? (
          <p className="italic text-gray-500">フィードバックはまだ生成されていません。</p>
        ) : (
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded text-sm mt-2">
            {feedback}
          </pre>
        )}
      </section>

      {/* 目標関連リンク */}
      <section className="mt-10 text-right space-x-4">
        <a
          href="/dashboard/race-goal"
          className="inline-block bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          📋 登録済みの目標一覧
        </a>
        <a
          href="/dashboard/race-goal/new"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          🎯 目標設定へ
        </a>
      </section>
    </main>
  )
}
