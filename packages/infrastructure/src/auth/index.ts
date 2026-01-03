import { Pool } from 'pg'
import { createAuth } from '@saastral/shared'

// Create a singleton pool for auth
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saastral',
  max: 10,
})

export const auth = createAuth(pool)
