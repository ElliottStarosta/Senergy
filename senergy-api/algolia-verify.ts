// algolia-verify.ts
// Quick verification of Algolia credentials

import dotenv from 'dotenv'
import fetch from 'node-fetch'

dotenv.config()

async function verifyAlgoliaCredentials() {
  const appId = process.env.ALGOLIA_APP_ID
  const apiKey = process.env.ALGOLIA_API_KEY || process.env.ALGOLIA_ADMIN_KEY

  console.log('🔍 Verifying Algolia Credentials\n')
  console.log('App ID:', appId)
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')
  console.log()

  if (!appId || !apiKey) {
    console.error('❌ Missing credentials!')
    return false
  }

  // Test 1: Check if App ID format is valid
  console.log('📋 Test 1: App ID Format')
  if (!/^[A-Z0-9]{10}$/.test(appId)) {
    console.log('  ⚠️  App ID format looks unusual')
    console.log('  Expected: 10 uppercase alphanumeric characters')
    console.log('  Got:', appId, `(${appId.length} chars)`)
  } else {
    console.log('  ✅ App ID format looks correct')
  }
  console.log()

  // Test 2: Try to reach Algolia API directly
  console.log('📋 Test 2: Direct API Check')
  try {
    const url = `https://${appId}-dsn.algolia.net/1/indexes`
    console.log('  Testing URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'X-Algolia-Application-Id': appId,
        'X-Algolia-API-Key': apiKey,
      },
    })

    console.log('  Response status:', response.status)
    
    if (response.status === 200) {
      console.log('  ✅ Connection successful!')
      const data = await response.json()
      console.log('  Indexes found:', data.items?.length || 0)
      return true
    } else if (response.status === 403) {
      console.log('  ❌ Authentication failed')
      console.log('  This means your API key is incorrect or doesn\'t have the right permissions')
      console.log()
      console.log('  💡 Solutions:')
      console.log('     1. Get your ADMIN API Key from: https://www.algolia.com/account/api-keys')
      console.log('     2. Make sure you\'re using the Admin key, not Search-Only key')
      return false
    } else if (response.status === 404) {
      console.log('  ❌ Application ID not found')
      console.log('  Your App ID appears to be incorrect')
      console.log()
      console.log('  💡 Solutions:')
      console.log('     1. Double-check your App ID at: https://www.algolia.com/account/api-keys')
      console.log('     2. Make sure you\'re using the correct Algolia account')
      return false
    } else {
      console.log('  ❌ Unexpected response:', response.statusText)
      const text = await response.text()
      console.log('  Body:', text.substring(0, 200))
      return false
    }
  } catch (error: any) {
    console.log('  ❌ Request failed:', error.message)
    
    if (error.code === 'ENOTFOUND') {
      console.log()
      console.log('  This means the hostname doesn\'t exist.')
      console.log('  Your Application ID is definitely incorrect.')
      console.log()
      console.log('  💡 Get the correct App ID from:')
      console.log('     https://www.algolia.com/account/api-keys')
    }
    return false
  }
}

verifyAlgoliaCredentials()
  .then(success => {
    console.log()
    if (success) {
      console.log('✅ All checks passed! Your Algolia credentials are correct.')
      console.log('   The issue must be elsewhere in your code.')
    } else {
      console.log('❌ Verification failed. Please fix the issues above.')
      console.log()
      console.log('🔗 Quick Links:')
      console.log('   Dashboard: https://www.algolia.com/dashboard')
      console.log('   API Keys: https://www.algolia.com/account/api-keys')
      console.log('   Applications: https://www.algolia.com/account/applications')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })