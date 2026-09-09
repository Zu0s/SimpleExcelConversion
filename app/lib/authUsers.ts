import bcrypt from 'bcryptjs'
import { shittyDb } from '../keys'
import { getDb, type AuthUser } from './mongo'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin'

export async function ensureUsers() {
  const col = (await getDb()).collection('users')
  await col.createIndex({ username: 1 }, { unique: true })

  const seeds: { username: string, password: string, role: string }[] = [
    ...shittyDb.users.map((currentUser) => ({
      username: currentUser.user,
      password: currentUser.password,
      role: currentUser.user === 'guest' ? 'guest' : 'user',
    })),
    { username: ADMIN_USERNAME, password: ADMIN_PASSWORD, role: 'admin' },
  ]

  for (const seed of seeds) {
    const existing = await col.findOne({ username: seed.username })
    if (existing) continue
    await col.insertOne({
      username: seed.username,
      passwordHash: await bcrypt.hash(seed.password, 10),
      role: seed.role,
      createdAt: new Date(),
    })
  }
}

export async function findUserByPassword(password: string): Promise<AuthUser | null> {
  if (typeof password !== 'string' || password.length === 0) return null
  await ensureUsers()
  const users = await (await getDb()).collection('users').find({}).toArray()
  for (const user of users) {
    if (typeof user.username !== 'string' || typeof user.passwordHash !== 'string') continue
    if (await bcrypt.compare(password, user.passwordHash)) {
      return {
        username: user.username,
        role: typeof user.role === 'string' ? user.role : 'user',
      }
    }
  }
  return null
}
