// /app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'

type Activity = {
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  start_date: string
}

type Feedback = {
  id: string
  feedback_text: string
  week_start: string
}

export default function DashboardPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stravaId, setStravaId] = useState<number | null>(null)

  // ✅ strava_id を localStorage から取得して、ログを出力
  useEffect(() => {
    const id = localStorage.getItem('strava_id')
    if (id) {
      const parsedId = parseInt(id)
      console.log('✅ strava_id 取得:', parsedId)
      setStravaId(parsedId)
    } else {
      console.warn('⚠️ strava_id が localStorage に存在しません')
    }
  }, [])

  // 🔄 strava_id が取得できたらアクティビティとフィードバックを取得
  useEffect(() => {
    const fetchActivities = async () => {
      if (!stravaId) return

      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + 1)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const start = weekStart.toISOString().split('T')[0]
      const end = weekEnd.toISOString().split('T')[0]

      const res = await fetch(`/api/activities?strava_id=${stravaId}&start=${start}&end=${end}`)
      if (res.ok) {
        const data = await res.json()
        console.log('✅ activities 取得成功:', data)
        setActivities(data)
      } else {
        console.error('❌ アクティビティ取得失敗:', await res.text())
      }
    }

    const fetchFeedback = async () => {
      if (!stravaId) return

      const now = new Date()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay() + 1)
      const week = weekStart.toISOString().split('T')[0]

      const res = await fetch(`/api/feedback?strava_id=${stravaId}&week=${week}`)
      if (res.ok) {
        const data = await res.json()
        console.log('✅ feedback 取得成功:', data)
        setFeedbacks(data)
      } else {
        console.error('❌ フィードバック取得失敗:', await res.text())
      }
    }

    fetchActivities()
    fetchFeedback()
  }, [stravaId])

  if (!stravaId) {
    return <p>ログインセッションが切れています。再ログインしてください。</p>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">今週のアクティビティ一覧</h1>
      <ul className="space-y-2">
        {Array.isArray(activities) && activities.map((activity) => (
          <li key={activity.id} className="border p-2 rounded">
            <div className="font-semibold">{activity.name}</div>
            <div>種目: {activity.type}</div>
            <div>距離: {(activity.distance / 1000).toFixed(2)} km</div>
            <div>時間: {Math.floor(activity.moving_time / 60)} 分</div>
            <div>日付: {new Date(activity.start_date).toLocaleDateString()}</div>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">フィードバックコメント</h2>
      <ul className="space-y-2">
        {Array.isArray(feedbacks) && feedbacks.map((feedback, index) => (
          <li key={index} className="bg-gray-100 p-2 rounded">
            <div className="text-sm text-gray-500">週: {feedback.week_start}</div>
            <div>{feedback.feedback_text}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
