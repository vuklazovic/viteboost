import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

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
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
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
            return Promise.reject(refreshError)
          }
        }
        
        return Promise.reject(error)
      }
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [session])

  // Load stored auth data on mount
  useEffect(() => {
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Login failed')
      }
      throw new Error('Login failed')
    }
  }

  const signup = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post('/auth/signup', { email, password })
      const { user: userData, session: sessionData } = response.data
      
      setUser(userData)
      setSession(sessionData)
      
      // Store in localStorage
      localStorage.setItem('auth_session', JSON.stringify(sessionData))
      localStorage.setItem('auth_user', JSON.stringify(userData))
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Signup failed')
      }
      throw new Error('Signup failed')
    }
  }

  const logout = () => {
    // Clear auth state
    setUser(null)
    setSession(null)
    
    // Clear localStorage
    localStorage.removeItem('auth_session')
    localStorage.removeItem('auth_user')
    
    // Optional: Call backend logout endpoint
    if (session?.access_token) {
      axios.post('/auth/logout').catch(() => {
        // Ignore errors on logout
      })
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    login,
    signup,
    logout,
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