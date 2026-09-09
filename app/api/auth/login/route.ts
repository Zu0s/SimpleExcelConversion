import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { shittyDb } from '../../../keys'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '../../../lib/session'

export async function POST(request: Request) {
  let password = ''
  try {
    const body = await request.json()
    password = typeof body?.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  const foundUser = shittyDb.users.find((currentUser) => currentUser.password === password)
  if (!foundUser) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, signSession(foundUser.user), sessionCookieOptions)
  return NextResponse.json({ user: foundUser.user })
}
