import { vi } from 'vitest'
import type { LoggerInterface } from '../../src/shared/interfaces/logger'

export function createMockLogger(): LoggerInterface {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}

// Export a singleton instance for convenience
export const mockLogger = createMockLogger()
