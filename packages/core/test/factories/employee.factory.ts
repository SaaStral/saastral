import { faker } from '@faker-js/faker'
import { Employee } from '../../src/employees/employee.entity'
import { Email } from '../../src/shared/value-objects/email'
import type { EmployeeProps } from '../../src/employees/employee.types'

type EmployeeFactoryProps = Partial<
  Omit<EmployeeProps, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'metadata' | 'email'>
> & {
  email?: string
}

export class EmployeeFactory {
  /**
   * Create a new employee with faker-generated data
   */
  static create(overrides?: EmployeeFactoryProps): Employee {
    return Employee.create({
      organizationId: overrides?.organizationId || faker.string.uuid(),
      name: overrides?.name || faker.person.fullName(),
      email: Email.create(overrides?.email || faker.internet.email()),
      title: overrides?.title,
      phone: overrides?.phone,
      avatarUrl: overrides?.avatarUrl,
      departmentId: overrides?.departmentId,
      managerId: overrides?.managerId,
      hiredAt: overrides?.hiredAt,
      externalId: overrides?.externalId,
      externalProvider: overrides?.externalProvider,
    })
  }

  /**
   * Create an offboarded employee
   */
  static createOffboarded(overrides?: EmployeeFactoryProps): Employee {
    const employee = this.create(overrides)
    employee.offboard()
    return employee
  }

  /**
   * Create a suspended employee
   */
  static createSuspended(overrides?: EmployeeFactoryProps): Employee {
    const employee = this.create(overrides)
    employee.suspend()
    return employee
  }

  /**
   * Create multiple employees
   */
  static createMany(count: number, overrides?: EmployeeFactoryProps): Employee[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }
}
