import { DomainError } from '../shared/errors/base.error'

export class SubscriptionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Subscription with id "${id}" not found`, 'SUBSCRIPTION_NOT_FOUND')
  }
}

export class SubscriptionAlreadyCancelledError extends DomainError {
  constructor(id: string) {
    super(`Subscription with id "${id}" is already cancelled`, 'SUBSCRIPTION_ALREADY_CANCELLED')
  }
}

export class SubscriptionAlreadyExpiredError extends DomainError {
  constructor(id: string) {
    super(`Subscription with id "${id}" has already expired`, 'SUBSCRIPTION_ALREADY_EXPIRED')
  }
}

export class InvalidSubscriptionStatusError extends DomainError {
  constructor(currentStatus: string, attemptedAction: string) {
    super(
      `Cannot ${attemptedAction} subscription with status "${currentStatus}"`,
      'INVALID_SUBSCRIPTION_STATUS'
    )
  }
}

export class InvalidSeatsConfigurationError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_SEATS_CONFIGURATION')
  }
}

export class SeatLimitExceededError extends DomainError {
  constructor(totalSeats: number, requestedSeats: number) {
    super(
      `Cannot assign ${requestedSeats} seats. Only ${totalSeats} total seats available.`,
      'SEAT_LIMIT_EXCEEDED'
    )
  }
}
