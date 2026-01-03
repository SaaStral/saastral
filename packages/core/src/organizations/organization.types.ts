/**
 * Input for creating an organization
 */
export interface CreateOrganizationInput {
  name: string
  userId: string
}

/**
 * Output for organization creation
 */
export interface CreateOrganizationOutput {
  organization: {
    id: string
    name: string
    slug: string
  }
}
