import { OrganizationRepository, CreateOrganizationData } from './organization.repository'
import { OrganizationMemberRepository } from './organization-member.repository'
import { LoggerInterface } from '../shared/interfaces/logger'
import { CreateOrganizationInput, CreateOrganizationOutput } from './organization.types'

/**
 * Organization Service
 * Orchestrates organization-related use cases
 */
export class OrganizationService {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly organizationMemberRepo: OrganizationMemberRepository,
    private readonly logger: LoggerInterface
  ) {}

  // ============================================================================
  // Commands
  // ============================================================================

  /**
   * Create a new organization and make the user an owner
   * This is typically called after user signup during onboarding
   */
  async createOrganization(
    input: CreateOrganizationInput
  ): Promise<CreateOrganizationOutput> {
    const { name, userId } = input

    this.logger.info('[OrganizationService.createOrganization] Creating organization', {
      name,
      userId,
    })

    // Generate slug from name (simple version)
    const slug = this.generateSlug(name)

    // Create organization with default settings
    const organizationData: CreateOrganizationData = {
      name,
      slug,
      plan: 'team', // Default plan
      planStartedAt: new Date(),
      settings: {
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        alertDefaults: {
          unusedLicenseDays: 30,
          lowUtilizationThreshold: 50,
          renewalReminderDays: [30, 15, 7],
        },
      },
    }

    const organization = await this.organizationRepo.create(organizationData)

    this.logger.info('[OrganizationService.createOrganization] Organization created', {
      organizationId: organization.id,
    })

    // Create organization membership (make user owner)
    await this.organizationMemberRepo.create({
      organizationId: organization.id,
      userId,
      role: 'owner',
      acceptedAt: new Date(),
    })

    this.logger.info('[OrganizationService.createOrganization] User added as owner', {
      organizationId: organization.id,
      userId,
    })

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Generate URL-friendly slug from organization name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}
