/**
 * User Repository Interface (Port)
 * Defines the contract for user data access
 * Implementation will be in Infrastructure layer
 */
export interface UserRepository {
  /**
   * Check if any users exist in the database
   * Used to determine if this is first-time setup
   */
  hasUsers(): Promise<boolean>

  /**
   * Count total users
   */
  count(): Promise<number>

  /**
   * Find user by ID
   */
  findById(id: string): Promise<UserData | null>

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<UserData | null>
}

/**
 * User data type returned by repository
 */
export interface UserData {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}
