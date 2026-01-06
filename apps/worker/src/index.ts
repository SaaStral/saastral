import 'dotenv/config'
import { run } from 'graphile-worker'

async function main() {
  console.log('Starting SaaStral Worker...')

  const runner = await run({
    connectionString: process.env.DATABASE_URL,
    concurrency: 5,
    pollInterval: 1000,
    taskList: {
      // @ts-ignore - Graphile Worker dynamic import type resolution limitation
      'sync-google-directory': () => import('./tasks/sync-google-directory'),
      // 'poll-okta-events': () => import('./tasks/poll-okta-events'),
      // 'check-renewals': () => import('./tasks/check-renewals'),
      // 'check-unused-licenses': () => import('./tasks/check-unused-licenses'),
      // 'check-orphaned-licenses': () => import('./tasks/check-orphaned-licenses'),
      // 'send-alert-email': () => import('./tasks/send-alert-email'),
    },
    // Cron jobs - scheduled tasks
    crontab: `
      # Sync Google Workspace every hour
      0 * * * * sync-google-directory
    `,
  })

  console.log('✅ Worker started successfully')

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down worker...')
    await runner.stop()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((error) => {
  console.error('❌ Worker failed to start:', error)
  process.exit(1)
})
