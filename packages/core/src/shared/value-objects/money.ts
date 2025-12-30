export class Money {
  private constructor(
    private readonly cents: number,
    private readonly currency: string = 'BRL'
  ) {
    if (cents < 0) throw new Error('Amount cannot be negative')
  }

  static fromCents(cents: number, currency = 'BRL'): Money {
    return new Money(Math.round(cents), currency)
  }

  static fromDecimal(decimal: number, currency = 'BRL'): Money {
    return new Money(Math.round(decimal * 100), currency)
  }

  static zero(currency = 'BRL'): Money {
    return new Money(0, currency)
  }

  getCents(): number {
    return this.cents
  }

  getDecimal(): number {
    return this.cents / 100
  }

  getCurrency(): string {
    return this.currency
  }

  add(other: Money): Money {
    this.assertSameCurrency(other)
    return new Money(this.cents + other.cents, this.currency)
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other)
    return new Money(this.cents - other.cents, this.currency)
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor), this.currency)
  }

  divide(divisor: number): Money {
    if (divisor === 0) throw new Error('Cannot divide by zero')
    return new Money(Math.round(this.cents / divisor), this.currency)
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other)
    return this.cents > other.cents
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other)
    return this.cents < other.cents
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.cents === other.cents
  }

  format(locale = 'pt-BR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.getDecimal())
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot operate on different currencies: ${this.currency} and ${other.currency}`)
    }
  }
}
