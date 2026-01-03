import { DomainError } from '../shared/errors/base.error'

export class EmployeeNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Employee with id "${id}" not found`, 'EMPLOYEE_NOT_FOUND')
  }
}

export class EmployeeAlreadyOffboardedError extends DomainError {
  constructor(id: string) {
    super(`Employee with id "${id}" is already offboarded`, 'EMPLOYEE_ALREADY_OFFBOARDED')
  }
}

export class EmployeeAlreadyExistsError extends DomainError {
  constructor(email: string, organizationId: string) {
    super(
      `Employee with email "${email}" already exists in organization "${organizationId}"`,
      'EMPLOYEE_ALREADY_EXISTS'
    )
  }
}

export class InvalidEmployeeStatusError extends DomainError {
  constructor(currentStatus: string, attemptedAction: string) {
    super(
      `Cannot ${attemptedAction} employee with status "${currentStatus}"`,
      'INVALID_EMPLOYEE_STATUS'
    )
  }
}
