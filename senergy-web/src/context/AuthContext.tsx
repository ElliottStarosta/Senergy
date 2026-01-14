import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, AuthState } from '@/types'
import axios from 'axios'
import { api } from '@/api/config' 
import { APIDocumentation } from '@/pages/APIDocumentation'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  updateUserProfile: (partial: Partial<User>) => void
  user: User | null
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token') || null,
    isLoading: true,
    error: null,
  })

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        try {
          console.log('[AuthContext] Verifying token on mount...')
          
          const response = await api.get('/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` },
          })

          console.log('[AuthContext] Token verified on mount')
          setState(prev => ({
            ...prev,
            user: response.data.user,
            token,
            isLoading: false,
            error: null,
          }))
        } catch (error: any) {
          console.warn('[AuthContext] Token verification failed on mount:', error.message)
          localStorage.removeItem('auth_token')
          setState(prev => ({ ...prev, isLoading: false, token: null, user: null, error: null }))
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    }

    verifyToken().catch((error) => {
      console.error('[AuthContext] Error in verifyToken:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    })
  }, [])

  // Listen for custom token-verified event (from Login component)
  useEffect(() => {
    const handleTokenVerified = (event: any) => {
      console.log('[AuthContext] Received token-verified event')
      const { user, token } = event.detail
      setState({
        user,
        token,
        isLoading: false,
        error: null,
      })
    }

    window.addEventListener('token-verified', handleTokenVerified)
    return () => window.removeEventListener('token-verified', handleTokenVerified)
  }, [])

  // Listen for storage changes (for multi-tab scenarios)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('[AuthContext] Storage changed from another tab/window')
        const newToken = e.newValue
        
        if (newToken) {
          setState(prev => ({ ...prev, isLoading: true }))
          
          const verifyNewToken = async () => {
            try {
              const axiosInstance = axios.create({ timeout: 5000 })
              const response = await axiosInstance.get('/api/auth/verify', {
                headers: { Authorization: `Bearer ${newToken}` },
              })
              console.log('[AuthContext] New token verified from storage event')
              setState(prev => ({
                ...prev,
                user: response.data.user,
                token: newToken,
                isLoading: false,
                error: null,
              }))
            } catch (error: any) {
              console.error('[AuthContext] New token verification failed:', error.message)
              localStorage.removeItem('auth_token')
              setState(prev => ({ ...prev, token: null, user: null, isLoading: false, error: null }))
            }
          }
          verifyNewToken()
        } else {
          console.log('[AuthContext] Token cleared from another tab/window')
          setState(prev => ({ ...prev, token: null, user: null, isLoading: false }))
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { user, token } = response.data

      localStorage.setItem('auth_token', token)
      setState({
        user,
        token,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }))
      throw error
    }
  }, [])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await axios.post('/api/auth/register', { email, password, displayName })
      const { user, token } = response.data

      localStorage.setItem('auth_token', token)
      setState({
        user,
        token,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMsg,
      }))
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    })
  }, [])

  const updateUserProfile = useCallback((partial: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...partial } : prev.user,
    }))
  }, [])

  const value: AuthContextType = {
    ...state,
    user: state.user,
    login,
    register,
    logout,
    isAuthenticated: !!state.user,
    updateUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}