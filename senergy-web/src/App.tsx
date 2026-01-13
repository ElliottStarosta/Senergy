import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'

// Pages
import { Login } from '@/pages/Login'
import { Explore } from '@/pages/Explore'
import { Register } from '@/pages/Register'
import { Quiz } from '@/pages/Quiz'
import { AuthCallback } from '@/pages/AuthCallback'
import { Dashboard } from '@/pages/Dashboard'
import { Rate } from '@/pages/Rate'
import { Groups } from '@/pages/Groups'
import { Matching } from '@/pages/Matching'
import { PlaceDetails } from '@/pages/PlaceDetails'
import { DiscordBotDocs } from '@/pages/DiscordBotDocs'
import { DiscordVerify } from '@/pages/DiscordVerify'
import { APIDocumentation } from '@/pages/APIDocumentation'


// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-primary-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect to quiz if user hasn't completed personality profile
  if (
    location.pathname !== '/quiz' &&
    !user?.personalityType &&
    location.pathname !== '/rate' &&
    location.pathname !== '/groups' &&
    location.pathname !== '/matching' &&
    location.pathname !== '/discord-verify'
  ) {
    return <Navigate to="/quiz" replace />
  }

  return <>{children}</>
}

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-primary-50">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary-600 mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* OAuth Callback */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected Routes */}
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        }
      />

      <Route
        path="/discord-verify"
        element={
          <ProtectedRoute>
            <DiscordVerify />
          </ProtectedRoute>
        }
      />

      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        }
      />

      <Route
        path="/discord-bot-docs"
        element={
          <ProtectedRoute>
            <DiscordBotDocs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/api-docs"
        element={
          <ProtectedRoute>
            <APIDocumentation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rate"
        element={
          <ProtectedRoute>
            <Rate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups/:groupId?"
        element={
          <ProtectedRoute>
            <Groups />
          </ProtectedRoute>
        }
      />

      <Route
        path="/matching"
        element={
          <ProtectedRoute>
            <Matching />
          </ProtectedRoute>
        }
      />

      <Route
        path="/places/:placeId"
        element={
          <ProtectedRoute>
            <PlaceDetails />
          </ProtectedRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Root fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}