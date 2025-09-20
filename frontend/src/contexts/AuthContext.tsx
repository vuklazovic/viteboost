import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface EmailCheckResult {
  exists: boolean
  user_id?: string
  email?: string
  email_confirmed?: boolean
  providers?: string[]
  is_google_user?: boolean
  is_email_user?: boolean
  created_at?: string
  suggested_action?: 'google_login' | 'email_login' | 'choose_method' | 'signup' | 'try_again'
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  emailConfirmationRequired: boolean
  credits: number
  refreshCredits: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  loginWithGoogle: () => Promise<void>
  logout: () => void
  handleEmailCallback: (urlFragment: string) => Promise<void>
  checkEmailExists: (email: string) => Promise<EmailCheckResult>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (accessToken: string, newPassword: string) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false)
  const [credits, setCredits] = useState<number>(0)

  // Set up axios interceptor for auth token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    return () => axios.interceptors.request.eject(interceptor)
  }, [session])

  // Set up response interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        
        if (error.response?.status === 401 && !originalRequest._retry && session?.refresh_token) {
          originalRequest._retry = true
          
          try {
            const response = await axios.post('/auth/refresh', {
              refresh_token: session.refresh_token
            })
            
            const newSession = response.data.session
            setSession(newSession)
            setUser(response.data.user)
            
            // Save to localStorage
            localStorage.setItem('auth_session', JSON.stringify(newSession))
            localStorage.setItem('auth_user', JSON.stringify(response.data.user))
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newSession.access_token}`
            return axios(originalRequest)
          } catch (refreshError) {
            // Refresh failed, logout user
            logout()
            toast.error('Session expired. Please log in again.')
            return Promise.reject(refreshError)
          }
        }
        
        return Promise.reject(error)
      }
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [session])

  // Define handleEmailCallback function first
  const handleEmailCallback = async (urlFragment: string): Promise<void> => {
    try {
      console.log('Processing email callback with URL fragment:', urlFragment)
      
      // Parse URL fragment to extract tokens
      const params = new URLSearchParams(urlFragment.substring(1)) // Remove # from start
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const expiresIn = params.get('expires_in')
      
      console.log('Extracted tokens:', { 
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        expiresIn 
      })
      
      if (!accessToken || !refreshToken) {
        throw new Error('Missing required tokens in callback URL')
      }
      
      // Create session object
      const sessionData: Session = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: parseInt(expiresIn || '3600'),
        token_type: 'bearer'
      }
      
      // Set session temporarily to make authenticated request
      setSession(sessionData)
      
      // Get user profile with the access token
      const response = await axios.get('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      const userData: User = {
        id: response.data.id,
        email: response.data.email,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at
      }
      
      // Set user and session
      setUser(userData)
      setSession(sessionData)
      setEmailConfirmationRequired(false)
      // Fetch credits after confirming email
      await refreshCredits()
      
      // Store in localStorage
      localStorage.setItem('auth_session', JSON.stringify(sessionData))
      localStorage.setItem('auth_user', JSON.stringify(userData))
      
      toast.success('Email confirmed! Welcome to VibeBoost!')
    } catch (error) {
      console.error('Email callback error:', error)
      toast.error('Failed to confirm email. Please try logging in manually.')
      throw error
    }
  }

  // Load stored auth data on mount and check for email confirmation tokens
  useEffect(() => {
    const checkForEmailConfirmation = async () => {
      // Skip token processing if we're on the callback route (EmailCallback component handles it)
      if (window.location.pathname === '/auth/callback') {
        setLoading(false)
        return
      }
      
      // Check if URL contains email confirmation tokens
      const urlFragment = window.location.hash
      
      if (urlFragment && urlFragment.includes('access_token')) {
        try {
          console.log('Email confirmation tokens detected:', urlFragment)
          await handleEmailCallback(urlFragment)
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
          
          setLoading(false)
          return
        } catch (error) {
          console.error('Email confirmation failed:', error)
          // Continue with normal auth check
        }
      }
      
      // Normal auth check - load stored data
      const storedSession = localStorage.getItem('auth_session')
      const storedUser = localStorage.getItem('auth_user')
      
      if (storedSession && storedUser) {
        try {
          const sessionData = JSON.parse(storedSession)
          const userData = JSON.parse(storedUser)
          
          setSession(sessionData)
          setUser(userData)
        } catch (error) {
          console.error('Failed to parse stored auth data:', error)
          localStorage.removeItem('auth_session')
          localStorage.removeItem('auth_user')
        }
      }
      
      setLoading(false)
    }

    checkForEmailConfirmation()
  }, [])

  // Fetch credits whenever we have a valid session and user
  useEffect(() => {
    if (user && session?.access_token) {
      refreshCredits()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, session?.access_token])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { user: userData, session: sessionData } = response.data
      
      setUser(userData)
      setSession(sessionData)
      
      // Store in localStorage
      localStorage.setItem('auth_session', JSON.stringify(sessionData))
      localStorage.setItem('auth_user', JSON.stringify(userData))
      // Fetch credits after login
      await refreshCredits()
    } catch (error) {
      // Re-throw the original error so LoginForm can handle it
      throw error
    }
  }

  const signup = async (email: string, password: string): Promise<{ requiresEmailConfirmation: boolean }> => {
    try {
      const response = await axios.post('/auth/signup', { email, password })
      
      // Check if we got a full auth response (immediate signup)
      if (response.data.user && response.data.session) {
        const { user: userData, session: sessionData } = response.data
        
        setUser(userData)
        setSession(sessionData)
        setEmailConfirmationRequired(false)
        
        // Store in localStorage
        localStorage.setItem('auth_session', JSON.stringify(sessionData))
        localStorage.setItem('auth_user', JSON.stringify(userData))
        
        toast.success('Account created successfully!')
        await refreshCredits()
        return { requiresEmailConfirmation: false }
      } 
      // Check if we got a message response (email confirmation required)
      else if (response.data.message) {
        setEmailConfirmationRequired(true)
        toast.success('Please check your email to confirm your account!')
        return { requiresEmailConfirmation: true }
      }
      
      throw new Error('Unexpected response format')
    } catch (error) {
      setEmailConfirmationRequired(false)
      // Re-throw the original error so RegisterForm can handle it
      throw error
    }
  }

  const logout = () => {
    // Clear auth state
    setUser(null)
    setSession(null)
    setEmailConfirmationRequired(false)
    
    // Clear localStorage
    localStorage.removeItem('auth_session')
    localStorage.removeItem('auth_user')
    
    // Optional: Call backend logout endpoint
    if (session?.access_token) {
      axios.post('/auth/logout').catch(() => {
        // Ignore errors on logout
      })
    }
    
    toast.success('Logged out successfully')
    setCredits(0)
  }

  const checkEmailExists = async (email: string): Promise<EmailCheckResult> => {
    try {
      const response = await axios.get(`/auth/check-email/${encodeURIComponent(email)}`)
      return response.data
    } catch (error) {
      // If error occurs, assume email doesn't exist
      return { exists: false, suggested_action: 'signup' }
    }
  }

  const loginWithGoogle = async (): Promise<void> => {
    try {
      // Redirect to Supabase Google OAuth
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      const googleAuthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`
      
      // Redirect to Google OAuth
      window.location.href = googleAuthUrl
    } catch (error) {
      toast.error('Google login failed')
      throw new Error('Google login failed')
    }
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post('/auth/forgot-password', { email })
      return {
        success: response.data.success,
        error: response.data.error
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        return {
          success: false,
          error: error.response.data.error || 'Failed to send reset email'
        }
      }
      return {
        success: false,
        error: 'Failed to send reset email'
      }
    }
  }

  const resetPassword = async (accessToken: string, newPassword: string): Promise<void> => {
    try {
      await axios.post('/auth/reset-password', {
        access_token: accessToken,
        new_password: newPassword
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error
      }
      throw new Error('Failed to reset password')
    }
  }

  const refreshCredits = async (): Promise<void> => {
    try {
      if (!session?.access_token) return
      const res = await axios.get('/auth/credits')
      setCredits(res.data?.credits ?? 0)
    } catch (e) {
      // Ignore silently; keep prior credits
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    emailConfirmationRequired,
    credits,
    refreshCredits,
    login,
    signup,
    loginWithGoogle,
    logout,
    handleEmailCallback,
    checkEmailExists,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!user && !!session
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
