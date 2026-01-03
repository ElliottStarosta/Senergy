// senergy-api/src/index.ts
import dotenv from 'dotenv'

// Load environment variables FIRST, before ANY other imports
dotenv.config()

import 'tsconfig-paths/register'
import { configureAlgoliaIndex } from './config/algolia'
import { createServer } from './server'

const PORT = parseInt(process.env.PORT || '3001', 10)

const server = createServer()

server.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  
  // Configure Algolia index on startup
  console.log('🔍 Checking Algolia configuration...')
  console.log(`   ALGOLIA_APP_ID: ${process.env.ALGOLIA_APP_ID ? 'Found' : 'Missing'}`)
  console.log(`   ALGOLIA_API_KEY: ${process.env.ALGOLIA_API_KEY ? 'Found' : 'Missing'}`)
  
  if (process.env.ALGOLIA_APP_ID && process.env.ALGOLIA_API_KEY) {
    console.log('🔍 Algolia credentials found, configuring...')
    // Small delay to ensure Algolia client is fully initialized
    setTimeout(async () => {
      await configureAlgoliaIndex()
    }, 1000)
  } else {
    console.log('ℹ️  Algolia not configured. Search will use OpenStreetMap.')
  }
})