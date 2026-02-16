/**
 * Test Database Setup with Testcontainers
 *
 * Automatically starts a PostgreSQL container for integration tests.
 * The container is created once per test run and cleaned up automatically.
 */
import { PrismaClient } from '@saastral/database'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { execSync } from 'child_process'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql'

let prisma: PrismaClient
let pool: Pool
let container: StartedPostgreSqlContainer

export async function setupTestDatabase() {
  // Start PostgreSQL container
  console.log('🐳 Starting PostgreSQL container (this may take 30-60 seconds on first run)...')

  let testDbUrl: string

  try {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withExposedPorts(5432)
      .withDatabase('saastral_test')
      .withUsername('test_user')
      .withPassword('test_password')
      .start()

    testDbUrl = container.getConnectionUri()
    process.env.DATABASE_URL = testDbUrl

    console.log(`✅ PostgreSQL container started at ${container.getHost()}:${container.getPort()}`)
  } catch (error: any) {
    console.error('❌ Failed to start PostgreSQL container:', error.message)
    console.error('Make sure Docker is running and you have pulled the postgres:16-alpine image')
    throw error
  }

  // Push schema to test database using Prisma
  console.log('📋 Pushing database schema...')
  try {
    execSync(
      `cd packages/database && npx prisma db push --config=./prisma/prisma.config.ts --accept-data-loss`,
      {
        env: { ...process.env, DATABASE_URL: testDbUrl },
        stdio: 'pipe', // Suppress output
        cwd: process.cwd().includes('packages/infrastructure')
          ? '../../'
          : process.cwd(),
      }
    )
    console.log('✅ Database schema pushed successfully')
  } catch (error: any) {
    console.error('❌ Failed to push schema:', error.message)
    throw error
  }

  // Create Prisma client with PG adapter
  pool = new Pool({ connectionString: testDbUrl })
  const adapter = new PrismaPg(pool)
  prisma = new PrismaClient({
    adapter,
    log: [], // Disable logs during tests
  })
  await prisma.$connect()

  console.log('✅ Test database ready')
  return prisma
}

export async function teardownTestDatabase() {
  console.log('🧹 Cleaning up test database...')

  if (prisma) {
    await prisma.$disconnect()
  }
  if (pool) {
    await pool.end()
  }
  if (container) {
    await container.stop()
    console.log('✅ PostgreSQL container stopped')
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
