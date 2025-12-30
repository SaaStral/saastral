/**
 * Cron job scheduler for periodic tasks
 *
 * Schedule format: minute hour day month day-of-week
 * Examples:
 * - '0 * * * *' - Every hour
 * - '*/15 * * * *' - Every 15 minutes
 * - '0 0 * * *' - Daily at midnight
 * - '0 9 * * 1' - Every Monday at 9am
 */

export const cronJobs = [
  {
    name: 'sync-google-directory',
    pattern: '0 */6 * * *', // Every 6 hours
    task: 'sync-google-directory',
    payload: {},
  },
  {
    name: 'poll-okta-events',
    pattern: '*/5 * * * *', // Every 5 minutes
    task: 'poll-okta-events',
    payload: {},
  },
  {
    name: 'check-renewals',
    pattern: '0 9 * * *', // Daily at 9am
    task: 'check-renewals',
    payload: {},
  },
  {
    name: 'check-unused-licenses',
    pattern: '0 10 * * 1', // Every Monday at 10am
    task: 'check-unused-licenses',
    payload: {},
  },
  {
    name: 'check-orphaned-licenses',
    pattern: '0 8 * * *', // Daily at 8am
    task: 'check-orphaned-licenses',
    payload: {},
  },
]
