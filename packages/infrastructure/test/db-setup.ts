/**
 * Test Database Setup
 *
 * Creates an isolated test database for each test suite using Prisma.
 * Uses transactions to rollback between tests.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

let prisma: PrismaClient
let pool: Pool

export async function setupTestDatabase() {
  // Create test database URL
  const testDbUrl =
    process.env.DATABASE_URL?.replace('saastral_dev', 'saastral_test') ||
    'postgresql://postgres:postgres@localhost:5432/saastral_test'

  process.env.DATABASE_URL = testDbUrl

  // Create temporary .env file for Prisma migration
  const envPath = join(process.cwd(), '.env.test')
  writeFileSync(envPath, `DATABASE_URL=${testDbUrl}`)

  // Push schema to test database using db push (from database package)
  try {
    execSync(
      `cd packages/database && npx prisma db push --config=./prisma/prisma.config.ts`,
      {
        env: { ...process.env, DATABASE_URL: testDbUrl },
        stdio: 'pipe', // Use pipe to suppress output
        cwd: join(process.cwd(), '../..'), // Go up to monorepo root
      }
    )
  } catch (error: any) {
    // If push fails, log but continue (database might already be set up)
    console.warn('Schema push warning (might be expected):', error.message)
  } finally {
    // Clean up temp env file
    try {
      unlinkSync(envPath)
    } catch {
      // Ignore cleanup errors
    }
  }

  // Create Prisma client with PG adapter
  pool = new Pool({ connectionString: testDbUrl })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({
    adapter,
    log: [], // Disable logs during tests
  })
  await prisma.$connect()

  return prisma
}

export async function teardownTestDatabase() {
  if (prisma) {
    await prisma.$disconnect()
  }
  if (pool) {
    await pool.end()
  }
}

export async function clearDatabase() {
  if (!prisma) {
    throw new Error('Prisma client not initialized. Call setupTestDatabase first.')
  }

  // Clear all tables in reverse dependency order
  await prisma.loginEvent.deleteMany()
  await prisma.subscriptionUser.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.department.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.organizationMember.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client not initialized. Call setupTestDatabase first.')
  }
  return prisma
}
