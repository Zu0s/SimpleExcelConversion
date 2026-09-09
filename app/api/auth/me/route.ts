import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, readSession } from '../../../lib/session'

export async function GET() {
  const cookieStore = await cookies()
  const user = readSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!user) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 })
  }
  return NextResponse.json({ user })
}
