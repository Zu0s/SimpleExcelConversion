export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { findUserByPassword } from '../../../lib/authUsers'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '../../../lib/session'

export async function POST(request: Request) {
  let password = ''
  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  const foundUser = await findUserByPassword(password)
  if (!foundUser) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, signSession(foundUser.username), sessionCookieOptions)
  return NextResponse.json({ user: foundUser.username })
}
