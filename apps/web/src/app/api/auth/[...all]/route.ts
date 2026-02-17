import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Force Node.js runtime (required for pg module in auth)
export const runtime = 'nodejs'

export const { GET, POST } = toNextJsHandler(auth)
