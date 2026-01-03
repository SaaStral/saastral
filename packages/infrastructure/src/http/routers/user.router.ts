import { router, publicProcedure } from '../trpc'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Initialize Prisma
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saastral',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const userRouter = router({
  /**
   * Check if any users exist in the database
   * Used to determine if this is first-time setup (show signup) or not (show login)
   */
  hasUsers: publicProcedure.query(async () => {
    const userCount = await prisma.user.count()
    return { hasUsers: userCount > 0 }
  }),
})
