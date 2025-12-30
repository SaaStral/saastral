export type BillingCycleType = 'monthly' | 'yearly' | 'quarterly' | 'one-time'

export class BillingCycle {
  private constructor(
    private readonly type: BillingCycleType,
    private readonly intervalMonths: number
  ) {}

  static monthly(): BillingCycle {
    return new BillingCycle('monthly', 1)
  }

  static quarterly(): BillingCycle {
    return new BillingCycle('quarterly', 3)
  }

  static yearly(): BillingCycle {
    return new BillingCycle('yearly', 12)
  }

  static oneTime(): BillingCycle {
    return new BillingCycle('one-time', 0)
  }

  static fromType(type: BillingCycleType): BillingCycle {
    switch (type) {
      case 'monthly':
        return BillingCycle.monthly()
      case 'quarterly':
        return BillingCycle.quarterly()
      case 'yearly':
        return BillingCycle.yearly()
      case 'one-time':
        return BillingCycle.oneTime()
    }
  }

  getType(): BillingCycleType {
    return this.type
  }

  getIntervalMonths(): number {
    return this.intervalMonths
  }

  isRecurring(): boolean {
    return this.type !== 'one-time'
  }

  getNextBillingDate(currentDate: Date): Date | null {
    if (!this.isRecurring()) return null

    const nextDate = new Date(currentDate)
    nextDate.setMonth(nextDate.getMonth() + this.intervalMonths)
    return nextDate
  }

  toString(): string {
    return this.type
  }

  equals(other: BillingCycle): boolean {
    return this.type === other.type
  }
}
