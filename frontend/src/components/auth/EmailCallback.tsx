import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export function EmailCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { handleEmailCallback, isAuthenticated } = useAuth()
  const processed = useRef(false)

  useEffect(() => {
    const processedRef = processed.current
    if (processedRef) return
    processed.current = true
    const processEmailCallback = async () => {
      try {
        // Get the URL fragment (everything after #)
        const urlFragment = location.hash
        
        if (!urlFragment) {
          throw new Error('No authentication data found in URL')
        }

        // Handle the email callback
        await handleEmailCallback(urlFragment)
        
        setStatus('success')
        
        // Redirect to main app after 2 seconds
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 2000)
        
      } catch (error) {
        console.error('Email callback failed:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      }
    }

    processEmailCallback()
  // Only re-run when the hash changes; avoid depending on function identity
  }, [location.hash])

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated && status === 'success') {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, status, navigate])

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Confirming your email</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your account...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Email confirmed!</CardTitle>
            <CardDescription className="text-center">
              Welcome to VibeBoost! Redirecting you to the app...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 text-center">
                🎉 Your account is now active and you're logged in!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Verification failed</CardTitle>
            <CardDescription className="text-center">
              We couldn't confirm your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {errorMessage}
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/auth', { replace: true })}
                className="w-full"
              >
                Try logging in manually
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Retry verification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
