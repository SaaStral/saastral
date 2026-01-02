import { Pool } from 'pg'
import { createAuth } from '@saastral/shared'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saastral',
})

export const auth = createAuth(pool)

export type Session = typeof auth.$Infer.Session
