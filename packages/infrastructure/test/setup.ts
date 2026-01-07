import { beforeAll, afterAll, afterEach } from 'vitest'
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
} from './db-setup'

// Set encryption key for tests
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long-min'

beforeAll(async () => {
  await setupTestDatabase()
})

afterEach(async () => {
  await clearDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})
