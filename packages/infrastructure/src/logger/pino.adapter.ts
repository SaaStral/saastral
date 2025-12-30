import pino from 'pino'
import { LoggerInterface } from '@saastral/core'

export class PinoLogger implements LoggerInterface {
  private logger: pino.Logger

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    })
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context, message)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context, message)
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(context, message)
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context, message)
  }
}
