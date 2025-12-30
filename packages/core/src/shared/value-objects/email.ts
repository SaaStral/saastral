export class Email {
  private readonly value: string

  private constructor(value: string) {
    this.value = value
  }

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(normalized)) {
      throw new Error(`Invalid email format: ${value}`)
    }

    return new Email(normalized)
  }

  static reconstitute(value: string): Email {
    return new Email(value)
  }

  getValue(): string {
    return this.value
  }

  getDomain(): string {
    return this.value.split('@')[1]
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
