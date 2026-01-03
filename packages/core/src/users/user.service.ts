import { UserRepository } from './user.repository'
import { LoggerInterface } from '../shared/interfaces/logger'
import { HasUsersOutput } from './user.types'

/**
 * User Service
 * Orchestrates user-related use cases
 */
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly logger: LoggerInterface
  ) {}

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Check if any users exist in the database
   * Used to determine if this is first-time setup (show signup) or not (show login)
   */
  async hasUsers(): Promise<HasUsersOutput> {
    this.logger.info('[UserService.hasUsers] Checking if users exist')

    const hasUsers = await this.userRepo.hasUsers()

    return { hasUsers }
  }

  // ============================================================================
  // Commands
  // ============================================================================

  // TODO: Add command methods as needed:
  // - createUser (handled by BetterAuth)
  // - updateUser
  // - deleteUser
  // These will be implemented as needed
}
