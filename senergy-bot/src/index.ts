
import { startBot } from './bot'

console.log('🚀 Starting Senergy Discord Bot...')

startBot()
  .then(() => {
    console.log('✅ Bot started successfully!')
  })
  .catch(error => {
    console.error('❌ Failed to start bot:', error)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⛔ Bot shutting down...')
  process.exit(0)
})
