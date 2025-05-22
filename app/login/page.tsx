// /app/login/page.tsx
'use client'

export default function LoginPage() {
  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_STRAVA_REDIRECT_URI
    const scope = 'read,activity:read'

    // 🔍 環境変数の中身をブラウザで確認するためのログ出力
    console.log("Redirect URI:", redirectUri)

    const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`
    window.location.href = stravaAuthUrl
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button onClick={handleLogin} className="px-6 py-2 bg-orange-500 text-white rounded-xl">
        Stravaでログイン
      </button>
    </div>
  )
}
