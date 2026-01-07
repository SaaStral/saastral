import { vi } from 'vitest'

/**
 * Generic mock repository factory with in-memory storage
 * Creates type-safe mocks for repository interfaces
 *
 * Usage:
 * ```typescript
 * const mockRepo = createMockRepository<Employee>()
 * mockRepo.findById.mockResolvedValue(employee)
 * ```
 */
export function createMockRepository<T extends { id: string }>() {
  const store = new Map<string, T>()

  return {
    store,

    findById: vi.fn((id: string): Promise<T | null> => {
      return Promise.resolve(store.get(id) || null)
    }),

    save: vi.fn((entity: T): Promise<T> => {
      store.set(entity.id, entity)
      return Promise.resolve(entity)
    }),

    delete: vi.fn((id: string): Promise<void> => {
      store.delete(id)
      return Promise.resolve()
    }),

    clear: () => store.clear(),

    // Expose the store for direct manipulation in tests
    getAll: () => Array.from(store.values()),
  }
}
