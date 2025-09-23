import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
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
  created_at?: number
}


interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  authReady: boolean
  emailConfirmationRequired: boolean
  credits: number
  costPerImage: number
  numImages: number
  creditsLoading: boolean
  refreshCredits: () => Promise<void>
  refreshCreditsImmediate: () => Promise<void>
  updateCredits: (newCredits: number) => void
  updateNumImages: (newNumImages: number) => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
  loginWithGoogle: () => Promise<void>
  logout: () => void
  handleEmailCallback: (urlFragment: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (accessToken: string, newPassword: string) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL

// Separate axios instance without interceptors for refresh calls
const refreshClient = axios.create({ baseURL: API_BASE_URL })

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false)
  const [credits, setCredits] = useState<number>(0)
  const [costPerImage, setCostPerImage] = useState<number>(1)
  const [numImages, setNumImages] = useState<number>(3)
  const [creditsLoading, setCreditsLoading] = useState<boolean>(false)
  const [authReady, setAuthReady] = useState<boolean>(false)
  
  // Track if credits have been fetched to prevent infinite loops
  const creditsFetched = useRef(false)
  const isRefreshingCredits = useRef(false)
  const oauthCallbackProcessed = useRef(false)
  const retryCount = useRef(0)
  const lastRefreshTime = useRef(0)

  // Token refresh synchronization
  const isRefreshingToken = useRef(false)
  const refreshPromise = useRef<Promise<any> | null>(null)

  // Validate if a token is not expired (more conservative validation)
  const isTokenValid = (session: Session): boolean => {
    if (!session?.access_token || !session?.expires_in) return false

    // If no created_at timestamp, assume it's valid and let backend validate
    if (!session.created_at) {
      console.log('⚠️ Session missing created_at timestamp, allowing through')
      return true
    }

    // Check if token is expired (with 10 minute buffer for safety)
    const tokenAgeMs = Date.now() - session.created_at
    const expiryMs = session.expires_in * 1000
    const bufferMs = 10 * 60 * 1000 // 10 minutes buffer

    const isValid = tokenAgeMs < (expiryMs - bufferMs)

    if (!isValid) {
      console.log('🔒 Token validation failed:', {
        tokenAge: Math.floor(tokenAgeMs / 1000),
        expiresIn: session.expires_in,
        bufferSec: bufferMs / 1000
      })
    }

    return isValid
  }

  // Synchronized token refresh to prevent multiple simultaneous attempts
  const refreshTokenSynchronized = async (refreshToken: string): Promise<Session | null> => {
    // If already refreshing, wait for the existing promise
    if (isRefreshingToken.current && refreshPromise.current) {
      console.log('🔄 Token refresh already in progress, waiting...')
      try {
        return await refreshPromise.current
      } catch (error) {
        console.error('Failed to wait for token refresh:', error)
        return null
      }
    }

    // Start new refresh
    isRefreshingToken.current = true
    refreshPromise.current = (async () => {
      try {
        console.log('🔄 Starting synchronized token refresh')
        const response = await refreshClient.post('/auth/refresh', {
          refresh_token: refreshToken
        })

        const newSession = {
          ...response.data.session,
          created_at: Date.now() // Add timestamp for validation
        }

        console.log('✅ Token refreshed successfully')
        return newSession
      } catch (error) {
        console.error('❌ Token refresh failed:', error)
        throw error
      } finally {
        isRefreshingToken.current = false
        refreshPromise.current = null
      }
    })()

    return refreshPromise.current
  }

  // Validate and refresh session if needed
  const validateAndRefreshSession = async (storedSession: Session): Promise<Session | null> => {
    try {
      console.log('🔍 Starting session validation...')

      if (isTokenValid(storedSession)) {
        console.log('✅ Token is valid, using stored session')
        return storedSession
      }

      if (storedSession.refresh_token) {
        console.log('🔄 Token expired/invalid, attempting refresh')
        return await refreshTokenSynchronized(storedSession.refresh_token)
      }

      console.log('❌ No valid refresh token available')
      return null
    } catch (error) {
      console.error('❌ Session validation failed with error:', error)
      return null
    }
  }

  // Set up axios interceptor for auth token - BLOCKS unauthorized requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const url = config.url || ''

        // Allow auth endpoints to proceed without tokens
        const authEndpoints = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password']
        const isAuthEndpoint = authEndpoints.some(endpoint => url.includes(endpoint))

        if (isAuthEndpoint) {
          console.log('🔓 Allowing auth endpoint without token:', url)
          return config
        }

        // Block requests that require authentication if no valid token
        if (!session?.access_token) {
          console.error('🚫 BLOCKING request - no access token:', url)
          const error = new Error('No access token available')
          error.name = 'AuthenticationError'
          return Promise.reject(error)
        }

        // Check token validity but don't block - let the response interceptor handle refresh
        if (!isTokenValid(session)) {
          console.warn('⚠️ Token may be expired for request:', url, 'but allowing through for refresh')
        }

        // Add auth header for authenticated requests
        config.headers.Authorization = `Bearer ${session.access_token}`
        console.log('🔐 Adding auth header to request:', url)
        return config
      },
      (error) => Promise.reject(error)
    )

    return () => axios.interceptors.request.eject(interceptor)
  }, [session?.access_token, session])

  // Set up response interceptor for synchronized token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config || {}
        const requestUrl: string = originalRequest.url || ''

        // Avoid attempting to refresh when the refresh endpoint itself fails
        if (requestUrl.includes('/auth/refresh')) {
          console.log('❌ Refresh endpoint failed, logging out')
          logout()
          return Promise.reject(error)
        }

        // Handle authentication errors with synchronized token refresh
        if ((error.response?.status === 401 || error.response?.status === 403) &&
            !originalRequest._retry &&
            session?.refresh_token) {

          originalRequest._retry = true
          console.log('🔄 Auth error detected, attempting token refresh for:', requestUrl)

          try {
            // Use synchronized token refresh to prevent race conditions
            const newSession = await refreshTokenSynchronized(session.refresh_token)

            if (newSession) {
              // Update session state
              setSession(newSession)

              // Also update user data if available
              try {
                const profileResponse = await refreshClient.get('/auth/profile', {
                  headers: { Authorization: `Bearer ${newSession.access_token}` }
                })
                const userData = profileResponse.data
                setUser(userData)
                localStorage.setItem('auth_user', JSON.stringify(userData))
              } catch (profileError) {
                console.warn('Failed to refresh user profile:', profileError)
              }

              // Save refreshed session to localStorage
              localStorage.setItem('auth_session', JSON.stringify(newSession))

              console.log('✅ Token refreshed, retrying original request')

              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newSession.access_token}`
              return axios(originalRequest)
            } else {
              throw new Error('Token refresh returned null session')
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            console.error('❌ Token refresh failed, logging out:', refreshError)
            logout()
            toast.error('Session expired. Please log in again.')
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [session?.refresh_token])

  // Define handleEmailCallback function first
  const handleEmailCallback = async (urlFragment: string): Promise<void> => {
    try {
      
      // Parse URL fragment to extract tokens
      const params = new URLSearchParams(urlFragment.substring(1)) // Remove # from start
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const expiresIn = params.get('expires_in')
      
      // Do not log tokens or callback parameters
      
      if (!accessToken || !refreshToken) {
        throw new Error('Missing required tokens in callback URL')
      }
      
      // Create session object with timestamp
      const sessionData: Session = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: parseInt(expiresIn || '3600'),
        token_type: 'bearer',
        created_at: Date.now()
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

      // If profile includes credits, apply immediately; otherwise refresh
      const profileCredits: number | undefined = response.data?.credits
      const profileCostPerImage: number | undefined = response.data?.cost_per_image
      const profileNumImages: number | undefined = response.data?.num_images

      if (typeof profileCredits === 'number') {
        setCredits(profileCredits)
        if (typeof profileCostPerImage === 'number') setCostPerImage(profileCostPerImage)
        if (typeof profileNumImages === 'number') setNumImages(profileNumImages)

        localStorage.setItem('auth_credits', JSON.stringify({
          credits: profileCredits,
          costPerImage: typeof profileCostPerImage === 'number' ? profileCostPerImage : costPerImage,
          numImages: typeof profileNumImages === 'number' ? profileNumImages : numImages,
        }))
        creditsFetched.current = true
      } else {
        creditsFetched.current = false
        await refreshCreditsImmediate()
      }
      
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
      
      if (urlFragment && urlFragment.includes('access_token') && !oauthCallbackProcessed.current && retryCount.current < 3) {
        try {
          console.log('Email confirmation tokens detected:', urlFragment)
          retryCount.current += 1
          oauthCallbackProcessed.current = true
          await handleEmailCallback(urlFragment)
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
          
          setLoading(false)
          return
        } catch (error) {
          console.error('Email confirmation failed:', error)
          
          // For network errors, don't reset the flag to prevent infinite retries
          const errorCode = error?.code || error?.response?.status
          if (errorCode === 'ERR_NETWORK' || errorCode === 'ERR_CONNECTION_REFUSED' || !navigator.onLine) {
            toast.error('Cannot connect to server. Please check your connection and try again.')
            // Keep oauthCallbackProcessed.current = true to prevent retries
          } else {
            oauthCallbackProcessed.current = false // Reset on other errors only
          }
          
          // Clean up URL even on error
          window.history.replaceState({}, document.title, window.location.pathname)
          setLoading(false)
          return
        }
      }
      
      // Normal auth check - validate stored session
      console.log('🔄 Loading and validating stored session...')
      const storedSession = localStorage.getItem('auth_session')
      const storedUser = localStorage.getItem('auth_user')

      if (storedSession && storedUser) {
        try {
          const sessionData = JSON.parse(storedSession)
          const userData = JSON.parse(storedUser)

          console.log('📦 Found stored session, validating token...')

          // Add created_at timestamp if missing (for legacy sessions)
          if (!sessionData.created_at && sessionData.access_token) {
            console.log('🕒 Adding timestamp to legacy session')
            sessionData.created_at = Date.now()
            localStorage.setItem('auth_session', JSON.stringify(sessionData))
          }

          // Validate and potentially refresh the session
          console.log('🔍 Validating session:', {
            hasAccessToken: !!sessionData.access_token,
            hasRefreshToken: !!sessionData.refresh_token,
            createdAt: sessionData.created_at,
            expiresIn: sessionData.expires_in
          })
          const validSession = await validateAndRefreshSession(sessionData)

          if (validSession) {
            console.log('✅ Session validated successfully')
            setSession(validSession)
            setUser(userData)

            // Save refreshed session if it was updated
            if (validSession !== sessionData) {
              localStorage.setItem('auth_session', JSON.stringify(validSession))
            }

            // Try to restore credits from localStorage (but still fetch fresh data)
            const storedCredits = localStorage.getItem('auth_credits')
            if (storedCredits) {
              try {
                const creditsData = JSON.parse(storedCredits)
                setCredits(creditsData.credits || 0)
                setCostPerImage(creditsData.costPerImage || 1)
                setNumImages(creditsData.numImages || 3)
              } catch (error) {
                console.error('Failed to parse stored credits:', error)
                localStorage.removeItem('auth_credits')
              }
            }

            // Mark auth as ready only when we have a valid session
            setAuthReady(true)
            console.log('✅ Authentication ready with valid session')
          } else {
            console.log('❌ Session validation failed, clearing stored data')
            // Clear invalid session
            localStorage.removeItem('auth_session')
            localStorage.removeItem('auth_user')
            localStorage.removeItem('auth_credits')
            setSession(null)
            setUser(null)
            // Set auth ready even without valid session (user needs to login)
            setAuthReady(true)
            console.log('✅ Authentication ready (no valid session)')
          }
        } catch (error) {
          console.error('Failed to parse stored auth data:', error)
          localStorage.removeItem('auth_session')
          localStorage.removeItem('auth_user')
          localStorage.removeItem('auth_credits')
          setSession(null)
          setUser(null)
          setAuthReady(true)
          console.log('✅ Authentication ready (error during validation)')
        }
      } else {
        console.log('📭 No stored session found')
        setAuthReady(true)
        console.log('✅ Authentication ready (no stored session)')
      }

      setLoading(false)
      console.log('✅ Authentication initialization complete')
    }

    checkForEmailConfirmation()
  }, [])

  // Fetch credits when user is authenticated and auth is ready
  useEffect(() => {
    if (user?.id && session?.access_token && authReady && !creditsFetched.current && !isRefreshingCredits.current) {
      creditsFetched.current = true
      refreshCreditsImmediate()
    }
  }, [user?.id, session?.access_token, authReady])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { user: userData, session: sessionData } = response.data

      // Add timestamp for token validation
      const sessionWithTimestamp = {
        ...sessionData,
        created_at: Date.now()
      }

      setUser(userData)
      setSession(sessionWithTimestamp)
      
      // Store auth in localStorage
      localStorage.setItem('auth_session', JSON.stringify(sessionWithTimestamp))
      localStorage.setItem('auth_user', JSON.stringify(userData))

      // Always fetch credits immediately after login to ensure UI is up to date
      console.log('🔄 Fetching credits immediately after login...')
      creditsFetched.current = false
      await refreshCreditsImmediate()
      console.log('✅ Credits fetched after login')
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
        
        // If backend returns credits on signup, apply immediately
        const signupCredits: number | undefined = response.data?.credits
        const signupCostPerImage: number | undefined = response.data?.cost_per_image
        const signupNumImages: number | undefined = response.data?.num_images

        if (typeof signupCredits === 'number') {
          setCredits(signupCredits)
          if (typeof signupCostPerImage === 'number') setCostPerImage(signupCostPerImage)
          if (typeof signupNumImages === 'number') setNumImages(signupNumImages)

          localStorage.setItem('auth_credits', JSON.stringify({
            credits: signupCredits,
            costPerImage: typeof signupCostPerImage === 'number' ? signupCostPerImage : costPerImage,
            numImages: typeof signupNumImages === 'number' ? signupNumImages : numImages,
          }))

          creditsFetched.current = true
        } else {
          // Fallback to immediate refresh
          creditsFetched.current = false
          await refreshCreditsImmediate()
        }
        
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
      // Re-throw the original error so RegisterForm can handle it
      throw error
    }
  }

  const logout = () => {
    console.log('🚪 Logging out user')

    // Clear auth state
    setUser(null)
    setSession(null)
    setEmailConfirmationRequired(false)
    setAuthReady(false)

    // Reset all tracking flags
    creditsFetched.current = false
    isRefreshingCredits.current = false
    oauthCallbackProcessed.current = false
    retryCount.current = 0
    isRefreshingToken.current = false
    refreshPromise.current = null

    // Clear localStorage
    localStorage.removeItem('auth_session')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_credits')

    // Optional: Call backend logout endpoint
    if (session?.access_token) {
      axios.post('/auth/logout').catch(() => {
        // Ignore errors on logout
      })
    }

    toast.success('Logged out successfully')
    setCredits(0)

    // Navigate to home page by setting window location directly
    window.location.href = '/'

    // Reset auth ready after logout
    setTimeout(() => setAuthReady(true), 100)
  }


  const loginWithGoogle = async (): Promise<void> => {
    try {
      // Use proper Supabase OAuth URL format
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured')
      }
      
      const redirectUrl = `${window.location.origin}/auth/callback`
      const googleAuthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`
      
      // Redirect to Google OAuth
      window.location.href = googleAuthUrl
    } catch (error) {
      toast.error('Google login failed')
      throw error
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

  const refreshCreditsCore = async (immediate: boolean = false): Promise<void> => {
    try {
      console.log(`💳 refreshCreditsCore called (immediate: ${immediate})`)

      if (!session?.access_token) {
        console.error('❌ No access token available for credit refresh')
        return
      }

      // For immediate calls (like payment success), bypass loading checks
      if (!immediate && (creditsLoading || isRefreshingCredits.current)) {
        console.log('⏸️ Skipping credit refresh - already in progress')
        return
      }

      // Prevent rapid successive calls (debounce for 1 second) unless immediate
      const now = Date.now()
      if (!immediate && now - lastRefreshTime.current < 1000) {
        console.log('⏸️ Skipping credit refresh - debounce')
        return
      }
      lastRefreshTime.current = now

      console.log('🔄 Starting credit refresh...')
      setCreditsLoading(true)
      isRefreshingCredits.current = true

      const res = await axios.get('/auth/credits')
      const credits = res.data?.credits ?? 0
      const costPerImage = res.data?.cost_per_image ?? 1
      const numImages = res.data?.num_images ?? 3

      console.log('💰 Credits refreshed:', { credits, costPerImage, numImages })

      setCredits(credits)
      setCostPerImage(costPerImage)
      setNumImages(numImages)

      // Store credits in localStorage for persistence
      localStorage.setItem('auth_credits', JSON.stringify({
        credits,
        costPerImage,
        numImages
      }))
    } catch (e) {
      // Handle errors with better user feedback
      console.error('Failed to refresh credits:', e)
      if (e.code === 'ERR_NETWORK' || e.code === 'ERR_CONNECTION_REFUSED') {
        // Network error - don't show toast as it might be temporary
        console.warn('Network error while refreshing credits, keeping cached values')
      } else {
        // Other errors - show toast but don't interrupt user flow
        toast.error('Unable to refresh credits balance')
      }
    } finally {
      setCreditsLoading(false)
      isRefreshingCredits.current = false
    }
  }

  const refreshCredits = async (): Promise<void> => {
    // Now just an alias for immediate refresh since debouncing is no longer needed
    await refreshCreditsCore(false)
  }

  const refreshCreditsImmediate = async (): Promise<void> => {
    // Execute immediately without debouncing
    await refreshCreditsCore(true)
  }

  const updateCredits = (newCredits: number) => {
    // Validate the credits value
    if (typeof newCredits !== 'number' || newCredits < 0 || !isFinite(newCredits)) {
      console.error('Invalid credits value received:', newCredits)
      toast.error('Received invalid credit balance from server')
      return
    }

    setCredits(newCredits)
    // Update localStorage as well
    const storedCredits = localStorage.getItem('auth_credits')
    if (storedCredits) {
      try {
        const creditsData = JSON.parse(storedCredits)
        creditsData.credits = newCredits
        localStorage.setItem('auth_credits', JSON.stringify(creditsData))
      } catch (error) {
        // If parsing fails, create new credits data
        localStorage.setItem('auth_credits', JSON.stringify({
          credits: newCredits,
          costPerImage,
          numImages
        }))
      }
    }
  }

  const updateNumImages = (newNumImages: number) => {
    // Validate the numImages value
    if (typeof newNumImages !== 'number' || newNumImages < 1 || newNumImages > 100 || !isFinite(newNumImages)) {
      console.error('Invalid numImages value received:', newNumImages)
      toast.error('Invalid number of images selected')
      return
    }

    setNumImages(newNumImages)
    // Update localStorage as well
    const storedCredits = localStorage.getItem('auth_credits')
    if (storedCredits) {
      try {
        const creditsData = JSON.parse(storedCredits)
        creditsData.numImages = newNumImages
        localStorage.setItem('auth_credits', JSON.stringify(creditsData))
      } catch (error) {
        // If parsing fails, create new credits data
        localStorage.setItem('auth_credits', JSON.stringify({
          credits,
          costPerImage,
          numImages: newNumImages
        }))
      }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    authReady,
    emailConfirmationRequired,
    credits,
    costPerImage,
    numImages,
    creditsLoading,
    refreshCredits,
    refreshCreditsImmediate,
    updateCredits,
    updateNumImages,
    login,
    signup,
    loginWithGoogle,
    logout,
    handleEmailCallback,
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
