// app/api/feedback/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

function formatActivitiesForPrompt(activities: any[]): string {
  if (activities.length === 0) return '(アクティビティ記録がありません)'
  return activities.map((a: any) =>
    `・${a.start_date.slice(0, 10)} ${a.type} ${(a.distance / 1000).toFixed(1)}km ${Math.round(a.moving_time / 60)}分`
  ).join('\n')
}

function getWeekRange(weekStartStr: string) {
  const start = new Date(weekStartStr)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('week')
  const userId = 20828320

  if (!weekStart) {
    return new Response('Missing week parameter', { status: 400 })
  }

  const { start, end } = getWeekRange(weekStart)
  const endStr = end.toISOString().slice(0, 10)

  const activitiesRes = await fetch(
    `http://localhost:3000/api/activities?strava_id=${userId}&start=${weekStart}&end=${endStr}`
  )
  const allActivities = await activitiesRes.json()

  if (!Array.isArray(allActivities)) {
    console.error('❌ /api/activities の戻り値が配列ではありません:', allActivities)
    return new Response('アクティビティ取得失敗', { status: 500 })
  }

  const weekActivities = allActivities.filter((a: any) => {
    const date = new Date(a.start_date)
    return date >= start && date <= end
  })

  if (weekActivities.length === 0) {
    return new Response('該当週のアクティビティが見つかりませんでした。', { status: 200 })
  }

  const prompt = `
あなたはプロのトライアスロンコーチです。以下はアスリートの1週間のトレーニング記録です。
各種目（Swim, Bike, Run, その他）のバランス、距離、時間、種目の偏りをもとに簡潔なフィードバックを日本語で出してください。

【トレーニング記録】
${formatActivitiesForPrompt(weekActivities)}

【フィードバック】
`

  const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  const gptData = await gptRes.json()
  const message = gptData.choices?.[0]?.message?.content || '生成に失敗しました'

  // ✅ 今が週末（日曜）以降なら Supabase に保存
  const now = new Date()
  if (now >= end) {
    const { error } = await supabase.from('feedback_log').insert({
      strava_id: userId,
      week_start: weekStart,
      feedback_text: message,
    })

    if (error) {
      console.error('❌ Supabase insert error:', error)
    }
  } else {
    console.log('🕒 今は週の途中。フィードバックは保存せず、表示のみ。')
  }

  return new Response(message, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
