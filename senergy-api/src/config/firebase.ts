import admin from 'firebase-admin'
import dotenv from 'dotenv'

// Load environment variables FIRST
dotenv.config()

const serviceAccountKey = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CERT_URL,
}

// Validate that required env vars are present
if (!process.env.FIREBASE_PROJECT_ID) {
  console.error('❌ Missing FIREBASE_PROJECT_ID environment variable')
  process.exit(1)
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Missing FIREBASE_PRIVATE_KEY environment variable')
  process.exit(1)
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('❌ Missing FIREBASE_CLIENT_EMAIL environment variable')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey as admin.ServiceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  })
}

export const db = admin.firestore()
export const auth = admin.auth()
export const realtimeDb = admin.database()

export default admin