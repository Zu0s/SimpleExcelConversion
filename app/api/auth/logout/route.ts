export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '../../../lib/session'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  })
  return new NextResponse(null, { status: 204 })
}
