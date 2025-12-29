// algolia-debug.ts
// Run this to verify your Algolia credentials and test connection

import algoliasearch from 'algoliasearch'
import dotenv from 'dotenv'

dotenv.config()

async function testAlgoliaConnection() {
  console.log('🔍 Testing Algolia Configuration...\n')

  // Check environment variables (check both possible names)
  const appId = process.env.ALGOLIA_APP_ID
  const adminKey = process.env.ALGOLIA_ADMIN_KEY || process.env.ALGOLIA_API_KEY
  const indexName = process.env.ALGOLIA_INDEX_NAME || 'places'

  console.log('📋 Configuration Check:')
  console.log('  ALGOLIA_APP_ID:', appId ? `${appId.substring(0, 4)}...` : '❌ MISSING')
  console.log('  ALGOLIA_ADMIN_KEY:', adminKey ? `${adminKey.substring(0, 4)}...` : '❌ MISSING')
  if (process.env.ALGOLIA_API_KEY && !process.env.ALGOLIA_ADMIN_KEY) {
    console.log('  ℹ️  Using ALGOLIA_API_KEY as admin key')
  }
  console.log('  ALGOLIA_INDEX_NAME:', indexName)
  console.log()

  if (!appId || !adminKey) {
    console.error('❌ Missing required environment variables!')
    console.log('\n📝 Add these to your .env file:')
    console.log('ALGOLIA_APP_ID=your_app_id')
    console.log('ALGOLIA_ADMIN_KEY=your_admin_key  # or ALGOLIA_API_KEY')
    console.log('ALGOLIA_INDEX_NAME=places')
    console.log('\n🔗 Get credentials from: https://www.algolia.com/account/api-keys')
    process.exit(1)
  }

  // Test connection
  try {
    console.log('🔌 Testing connection to Algolia...')
    
    const client = algoliasearch(appId, adminKey)
    const index = client.initIndex(indexName)

    // Try to get settings (minimal API call)
    console.log('📡 Fetching index settings...')
    const settings = await index.getSettings()
    
    console.log('✅ Connection successful!')
    console.log('\n📊 Index Settings:')
    console.log('  Searchable Attributes:', settings.searchableAttributes || 'default')
    console.log('  Custom Ranking:', settings.customRanking || 'none')
    console.log()

    // Check if index has records
    console.log('📈 Checking index status...')
    const stats = await index.search('', { hitsPerPage: 0 })
    console.log(`  Total records: ${stats.nbHits}`)
    
    if (stats.nbHits === 0) {
      console.log('\n⚠️  Index is empty. This is normal for a new setup.')
      console.log('   Places will be indexed when users rate them.')
    }

    return true
  } catch (error: any) {
    console.error('\n❌ Connection failed!')
    console.error('Error:', error.message)
    
    if (error.message.includes('Unreachable hosts')) {
      console.log('\n🔍 Troubleshooting tips:')
      console.log('  1. Verify your Application ID is correct')
      console.log('  2. Check you\'re using the ADMIN API key (not Search-Only key)')
      console.log('  3. Ensure your Algolia account is active')
      console.log('  4. Try generating new API keys from the dashboard')
      console.log('\n🔗 Dashboard: https://www.algolia.com/dashboard')
    }
    
    return false
  }
}

// Run the test
testAlgoliaConnection()
  .then(success => {
    if (success) {
      console.log('✅ All checks passed! Algolia is ready to use.')
      process.exit(0)
    } else {
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })