import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import admin, { db, auth } from '@/config/firebase'
import { User } from '@/types'

interface CreateUserData {
  email: string
  password: string
  displayName: string
  lastRatedPlaceLocation?: { lat: number; lng: number } | null
}

export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'some_key'

  async registerUser(data: CreateUserData): Promise<{ user: User; token: string }> {
    const { email, password, displayName } = data

    try {
      // Create user in Firebase Authentication
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      })

      // Create user document in Firestore
      const user: User = {
        id: userRecord.uid,
        email: userRecord.email || '',
        displayName: userRecord.displayName || displayName,
        createdAt: new Date().toISOString(),
        totalRatingsCount: 0,
        totalGroupsJoined: 0,
      }

      // Add location if provided
      const userData: any = { ...user }
      if (data.lastRatedPlaceLocation) {
        userData.lastRatedPlaceLocation = data.lastRatedPlaceLocation
        console.log('[Auth] Setting initial location for user:', data.lastRatedPlaceLocation)
      }

      await db.collection('users').doc(userRecord.uid).set(userData)

      // Generate JWT token
      const token = this.generateToken(user)

      return { user, token }
    } catch (error: any) {
      console.error('[Auth] Registration error:', error.message)
      console.error('[Auth] Error code:', error.code)
      
      // Preserve Firebase error codes for better error handling
      const authError: any = new Error(error.message || 'Registration failed')
      authError.code = error.code
      throw authError
    }
  }

  async loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // Get user by email from Firestore
      const snapshot = await db.collection('users').where('email', '==', email).get()

      if (snapshot.empty) {
        throw new Error('Invalid credentials')
      }

      const userDoc = snapshot.docs[0]
      const userData = userDoc.data() as User

      // Verify the user exists in Firebase Auth (this is just a check)
      // Password verification happens on the frontend with Firebase SDK
      // or we could use Firebase REST API here
      
      const user: User = {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        createdAt: userData.createdAt,
        personalityType: userData.personalityType,
        adjustmentFactor: userData.adjustmentFactor,
        totalRatingsCount: userData.totalRatingsCount || 0,
        totalGroupsJoined: userData.totalGroupsJoined || 0,
      }

      const token = this.generateToken(user)

      return { user, token }
    } catch (error: any) {
      console.error('[Auth] Login error:', error.message)
      throw new Error('Invalid credentials')
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const doc = await db.collection('users').doc(userId).get()

      if (!doc.exists) {
        return null
      }

      const data = doc.data() as User
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        createdAt: data.createdAt,
        personalityType: data.personalityType,
        adjustmentFactor: data.adjustmentFactor,
        totalRatingsCount: data.totalRatingsCount || 0,
        totalGroupsJoined: data.totalGroupsJoined || 0,
      }
    } catch (error: any) {
      console.error('[Auth] Get user error:', error.message)
      return null
    }
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret)
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  private generateToken(user: User): string {
    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRE || '7d') as any,
    }

    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      this.jwtSecret,
      options
    )
  }

  async handleGoogleAuth(firebaseIdToken: string): Promise<{ user: User; token: string }> {
    try {
      console.log('[Auth] Verifying Firebase ID token from Google...')
      console.log('[Auth] Token length:', firebaseIdToken?.length || 0)
      
      if (!firebaseIdToken || firebaseIdToken.trim().length === 0) {
        throw new Error('Firebase ID token is empty or invalid')
      }
      
      // Verify the Firebase ID token
      let decodedToken
      try {
        decodedToken = await auth.verifyIdToken(firebaseIdToken)
      } catch (verifyError: any) {
        console.error('[Auth] Firebase token verification failed:', verifyError.message)
        console.error('[Auth] Error code:', verifyError.code)
        throw new Error(`Firebase token verification failed: ${verifyError.message}`)
      }
      
      const { uid, email, name, picture } = decodedToken

      if (!uid) {
        throw new Error('Invalid token: missing user ID')
      }

      console.log('[Auth] Firebase token verified for user:', uid, 'email:', email)

      // Check if user exists in Firestore
      let userDoc
      try {
        userDoc = await db.collection('users').doc(uid).get()
      } catch (dbError: any) {
        console.error('[Auth] Firestore read error:', dbError.message)
        throw new Error(`Database error: ${dbError.message}`)
      }

      if (!userDoc.exists) {
        console.log('[Auth] Creating new Google user:', uid)
        const newUser: User = {
          id: uid,
          email: email || '',
          displayName: name || email || 'User',
          avatar: picture,
          createdAt: new Date().toISOString(),
          totalRatingsCount: 0,
          totalGroupsJoined: 0,
        }

        try {
          await db.collection('users').doc(uid).set(newUser)
          const token = this.generateToken(newUser)
          console.log('[Auth] New Google user created successfully')
          return { user: newUser, token }
        } catch (createError: any) {
          console.error('[Auth] Error creating user:', createError.message)
          throw new Error(`Failed to create user: ${createError.message}`)
        }
      }

      // Existing user
      console.log('[Auth] Logging in existing Google user:', uid)
      const userData = userDoc.data() as User
      
      if (!userData) {
        throw new Error('User data is null or undefined')
      }
      
      const user: User = {
        id: userDoc.id,
        email: userData.email || email || '',
        displayName: userData.displayName || name || email || 'User',
        avatar: userData.avatar || picture,
        createdAt: userData.createdAt || new Date().toISOString(),
        personalityType: userData.personalityType,
        adjustmentFactor: userData.adjustmentFactor,
        totalRatingsCount: userData.totalRatingsCount || 0,
        totalGroupsJoined: userData.totalGroupsJoined || 0,
      }

      const token = this.generateToken(user)
      console.log('[Auth] Existing Google user logged in successfully')
      return { user, token }
    } catch (error: any) {
      console.error('[Auth] Google authentication error:', error)
      console.error('[Auth] Error stack:', error.stack)
      // Preserve the original error but add context
      const errorMessage = error.message || 'Unknown error occurred'
      const authError: any = new Error(`Google authentication failed: ${errorMessage}`)
      authError.originalError = error
      authError.statusCode = error.code === 'auth/argument-error' ? 400 : 500
      throw authError
    }
  }

  async handleGithubAuth(githubCode: string): Promise<{ user: User; token: string }> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: githubCode,
        }),
      })

      const tokenData = await tokenResponse.json() as any
      const accessToken = tokenData.access_token

      if (!accessToken) {
        throw new Error('Failed to get access token')
      }

      // Get user info from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      const githubUser = await userResponse.json() as any

      // Use GitHub ID as uid
      const uid = `github_${githubUser.id}`
      const email = githubUser.email || `${githubUser.login}@github.com`

      // Check if user exists
      const snapshot = await db.collection('users').where('email', '==', email).get()
      let userDoc: any = null

      if (!snapshot.empty) {
        userDoc = snapshot.docs[0]
      }

      if (!userDoc) {
        // Create new user
        const newUser: User = {
          id: uid,
          email,
          displayName: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
          createdAt: new Date().toISOString(),
          totalRatingsCount: 0,
          totalGroupsJoined: 0,
        }

        await db.collection('users').doc(uid).set(newUser)
        const token = this.generateToken(newUser)
        return { user: newUser, token }
      }

      // Existing user
      const userData = userDoc.data() as User
      const user: User = {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        createdAt: userData.createdAt,
        personalityType: userData.personalityType,
        adjustmentFactor: userData.adjustmentFactor,
        totalRatingsCount: userData.totalRatingsCount || 0,
        totalGroupsJoined: userData.totalGroupsJoined || 0,
      }

      const token = this.generateToken(user)
      return { user, token }
    } catch (error: any) {
      console.error('GitHub auth error:', error)
      throw new Error('GitHub authentication failed')
    }
  }

  async handleFirebaseAuth(decodedToken: any) {
  try {
    const { uid, email, name: displayName, picture: photoURL } = decodedToken
    
    if (!email) {
      throw new Error('No email found in Firebase token')
    }

    // Check if user exists
    let userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get()
    
    let userId: string
    let userData: any

    if (!userSnapshot.empty) {
      // Existing user
      const userDoc = userSnapshot.docs[0]
      userId = userDoc.id
      userData = userDoc.data()
      
      console.log('[Auth] Existing user found:', userData.displayName)
    } else {
      // New user
      console.log('[Auth] Creating new user from Firebase auth')
      const userRef = db.collection('users').doc()
      userId = userRef.id
      
      userData = {
        uid: uid,
        email: email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        provider: 'google',
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      }
      
      await userRef.set(userData)
      console.log('[Auth] New user created:', userData.displayName)
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userId, email: email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return {
      token,
      user: {
        id: userId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        provider: userData.provider,
      }
    }
  } catch (error: any) {
    console.error('[Auth] Firebase auth error:', error)
    throw error
  }
}

  async handleDiscordAuth(discordId: string, verificationCode?: string): Promise<{ user: User; token: string }> {
    try {
      // Find user by Discord ID
      const snapshot = await db.collection('users').where('discordId', '==', discordId).get()
      console.log("USER TO AUTHENTICATE", snapshot.docs[0].data() as User)

      if (snapshot.empty) {
        throw new Error('Discord account not linked. Please register and verify your Discord account first.')
      }

      const userDoc = snapshot.docs[0]
      const userData = userDoc.data() as User & { discordVerified?: boolean }

      // If verification code provided, verify it
      if (verificationCode) {
        // Check verification codes collection
        const codeDoc = await db.collection('verificationCodes').doc(verificationCode).get()
        console.log('CODE DOC', codeDoc.data())
        if (!codeDoc.exists) {
          throw new Error('Invalid verification code')
        }

        const codeData = codeDoc.data()
        const now = Date.now()
        const expiresAt = codeData?.expiresAt || 0

        // Check if code is expired (24 hours)
        if (now > expiresAt) {
          await db.collection('verificationCodes').doc(verificationCode).delete()
          throw new Error('Verification code has expired. Please request a new one.')
        }

        // Check if code belongs to this user
        if (codeData?.discordId !== userData?.discordId) {
          throw new Error('Verification code does not match this account')
        }

        // Mark user as verified and link Discord ID if not already linked
        await db.collection('users').doc(userDoc.id).update({
          discordVerified: true,
          discordId: discordId,
        })

        // Delete used verification code
        await db.collection('verificationCodes').doc(verificationCode).delete()
        console.log("DELETED VERFICATIOn CODE!!")
      } else {
        // No code provided - check if already verified
        if (!userData.discordVerified) {
          throw new Error('Discord account not verified. Please provide a verification code.')
        }
      }

      const user: User = {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        createdAt: userData.createdAt,
        personalityType: userData.personalityType,
        adjustmentFactor: userData.adjustmentFactor,
        discordId: userData.discordId || discordId,
        discordVerified: true,
        totalRatingsCount: userData.totalRatingsCount || 0,
        totalGroupsJoined: userData.totalGroupsJoined || 0,
      }

      const token = this.generateToken(user)
      return { user, token }
    } catch (error: any) {
      console.error('Discord auth error:', error)
      throw new Error(error.message || 'Discord authentication failed')
    }
  }

  async generateVerificationCode(userId: string, discordId: string): Promise<string> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    // Store code in Firestore
    await db.collection('verificationCodes').doc(code).set({
      userId,
      discordId,
      expiresAt,
      createdAt: new Date().toISOString(),
    })

    return code
  }
}

export const authService = new AuthService()
export default new AuthService()