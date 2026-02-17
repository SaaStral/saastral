import { faker } from '@faker-js/faker'
import { Subscription } from '../../src/subscriptions/subscription.entity'
import type {
  SubscriptionProps,
  SubscriptionCategory,
  SubscriptionBillingCycle,
  PricingModel,
} from '../../src/subscriptions/subscription.types'

type SubscriptionFactoryProps = Partial<
  Omit<SubscriptionProps, 'id' | 'status' | 'usedSeats' | 'createdAt' | 'updatedAt' | 'metadata'>
> & {
  status?: SubscriptionProps['status']
}

export class SubscriptionFactory {
  /**
   * Create a new subscription with faker-generated data
   */
  static create(overrides?: SubscriptionFactoryProps): Subscription {
    const startDate = overrides?.startDate || faker.date.past()
    const renewalDate = overrides?.renewalDate || faker.date.future()

    return Subscription.create({
      organizationId: overrides?.organizationId || faker.string.uuid(),
      name: overrides?.name || faker.company.name(),
      vendor: overrides?.vendor,
      category: overrides?.category || 'productivity',
      description: overrides?.description,
      website: overrides?.website,
      logoUrl: overrides?.logoUrl,
      tags: overrides?.tags || [],
      status: overrides?.status,
      contractType: overrides?.contractType,
      billingCycle: overrides?.billingCycle || 'monthly',
      pricingModel: overrides?.pricingModel || 'per_seat',
      currency: overrides?.currency || 'BRL',
      pricePerUnit: overrides?.pricePerUnit,
      totalMonthlyCost:
        overrides?.totalMonthlyCost || BigInt(faker.number.int({ min: 1000, max: 100000 })),
      annualValue: overrides?.annualValue,
      discountPercentage: overrides?.discountPercentage,
      originalPrice: overrides?.originalPrice,
      totalSeats: overrides?.totalSeats ?? 10,
      seatsUnlimited: overrides?.seatsUnlimited || false,
      licenseType: overrides?.licenseType,
      paymentMethod: overrides?.paymentMethod,
      billingEmail: overrides?.billingEmail,
      autoRenew: overrides?.autoRenew ?? true,
      costCenter: overrides?.costCenter,
      budgetCode: overrides?.budgetCode,
      startDate,
      renewalDate,
      cancellationDeadline: overrides?.cancellationDeadline,
      trialEndDate: overrides?.trialEndDate,
      reminderDays: overrides?.reminderDays || [30, 15, 7],
      ownerId: overrides?.ownerId,
      departmentId: overrides?.departmentId,
      approverId: overrides?.approverId,
      vendorContact: overrides?.vendorContact,
      notes: overrides?.notes,
      integrationId: overrides?.integrationId,
      ssoAppId: overrides?.ssoAppId,
      createdBy: overrides?.createdBy,
    })
  }

  /**
   * Create a trial subscription
   */
  static createTrial(overrides?: SubscriptionFactoryProps): Subscription {
    return this.create({
      ...overrides,
      status: 'trial',
      trialEndDate: faker.date.soon({ days: 14 }),
    })
  }

  /**
   * Create a cancelled subscription
   */
  static createCancelled(overrides?: SubscriptionFactoryProps): Subscription {
    const subscription = this.create(overrides)
    subscription.cancel()
    return subscription
  }

  /**
   * Create a suspended subscription
   */
  static createSuspended(overrides?: SubscriptionFactoryProps): Subscription {
    const subscription = this.create(overrides)
    subscription.suspend()
    return subscription
  }

  /**
   * Create an expired subscription
   */
  static createExpired(overrides?: SubscriptionFactoryProps): Subscription {
    const subscription = this.create(overrides)
    subscription.expire()
    return subscription
  }

  /**
   * Create multiple subscriptions
   */
  static createMany(count: number, overrides?: SubscriptionFactoryProps): Subscription[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }
}
