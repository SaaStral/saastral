/**
 * Extended DI container for cloud deployments.
 *
 * Adds cloud-specific services (Stripe, metering, etc.) on top of
 * the base Container from @saastral/infrastructure.
 *
 * Usage:
 *   import { CloudContainer, initCloudContainer } from '@saastral/cloud'
 *
 *   // At app startup (e.g., in instrumentation.ts or route handler):
 *   initCloudContainer()
 *
 * This replaces the global container so that `getContainer()` returns
 * a CloudContainer, making cloud services available everywhere.
 */

import { Container, setContainer, getContainer } from '@saastral/infrastructure'
import { StripeService } from './services/stripe.service'

export class CloudContainer extends Container {
  private cloudInstances = new Map<string, unknown>()

  get stripeService(): StripeService {
    return this.cloudSingleton('stripeService', () => new StripeService())
  }

  // Future cloud services:
  // get meteringService(): MeteringService { ... }
  // get provisioningService(): ProvisioningService { ... }

  private cloudSingleton<T>(key: string, factory: () => T): T {
    if (!this.cloudInstances.has(key)) {
      this.cloudInstances.set(key, factory())
    }
    return this.cloudInstances.get(key) as T
  }

  override clear(): void {
    super.clear()
    this.cloudInstances.clear()
  }
}

/**
 * Initializes the global container as a CloudContainer.
 *
 * Call this once at app startup in the cloud deployment.
 * After this, `getContainer()` from @saastral/infrastructure
 * will return the CloudContainer instance.
 */
export function initCloudContainer(): CloudContainer {
  const container = new CloudContainer()
  setContainer(container)
  return container
}

/**
 * Type-safe accessor for the cloud container.
 * Only use in code that is guaranteed to run in the cloud deployment.
 */
export function getCloudContainer(): CloudContainer {
  return getContainer() as CloudContainer
}
