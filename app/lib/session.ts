import { createHmac, timingSafeEqual } from 'crypto'

export const SESSION_COOKIE = 'simpleExcelSession'

const SESSION_MS = 30 * 24 * 60 * 60 * 1000

function sessionSecret() {
  return process.env.SESSION_SECRET || 'dev-only-simple-excel-session'
}

export function signSession(user: string) {
  const payload = Buffer.from(JSON.stringify({
    user,
    exp: Date.now() + SESSION_MS,
  })).toString('base64url')
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, sig] = parts
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      user?: unknown
      exp?: unknown
    }
    if (typeof data.user !== 'string' || data.user.length === 0) return null
    if (typeof data.exp === 'number' && Date.now() > data.exp) return null
    return data.user
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_MS / 1000,
}
