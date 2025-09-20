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

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  emailConfirmationRequired: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  logout: () => void
  handleEmailCallback: (urlFragment: string) => Promise<void>
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

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { user: userData, session: sessionData } = response.data
      
      setUser(userData)
      setSession(sessionData)
      
      // Store in localStorage
      localStorage.setItem('auth_session', JSON.stringify(sessionData))
      localStorage.setItem('auth_user', JSON.stringify(userData))
      
      toast.success('Welcome back!')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || 'Login failed'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }
      toast.error('Login failed')
      throw new Error('Login failed')
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
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || 'Signup failed'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }
      toast.error('Signup failed')
      throw new Error('Signup failed')
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
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    emailConfirmationRequired,
    login,
    signup,
    logout,
    handleEmailCallback,
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