import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CLIENT_ID = Deno.env.get('DIGILOCKER_CLIENT_ID')!
const CLIENT_SECRET = Deno.env.get('DIGILOCKER_CLIENT_SECRET')!
const REDIRECT_URI = Deno.env.get('DIGILOCKER_REDIRECT_URI')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  try {
    const { code } = await req.json()

    if (!code) {
      return new Response(JSON.stringify({ error: 'No code provided' }), { status: 400 })
    }

    // Exchange code for token
const tokenRes = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/token', {
  ...
})      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      })
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: 'Token exchange failed', details: tokenData }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }

    // Fetch user info using access token
    const userRes = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })

    const userData = await userRes.json()

    // Fetch DigiLocker files if available
    const filesRes = await fetch('https://meripehchaan.gov.in/public/oauth2/1/files', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    const filesData = await filesRes.json()

    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      user: userData,
      files: filesData,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }
})