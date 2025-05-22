// app/api/auth/login/route.ts
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID
  const redirectUri = process.env.STRAVA_REDIRECT_URI
  const scope = 'read,activity:read'

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=auto&scope=${scope}`

  return Response.redirect(stravaAuthUrl)
}
