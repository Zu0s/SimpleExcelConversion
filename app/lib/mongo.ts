import { MongoClient, type Db } from 'mongodb'

const uri = process.env.MONGODB_URI

let clientPromise: Promise<MongoClient> | undefined

function getClientPromise() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }
  const globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = new MongoClient(uri).connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
  return clientPromise
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise()
  return client.db(process.env.MONGODB_DB || 'simple-excel-conversion')
}

export type AuthUser = {
  username: string
  role: string
}
