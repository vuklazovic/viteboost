import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshCredits } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Refresh credits after successful payment with retry logic
    const refreshUserData = async (retryCount = 0) => {
      try {
        await refreshCredits()
        toast.success('Payment successful! Your subscription is now active.')
        setLoading(false)
      } catch (error) {
        console.error('Error refreshing credits:', error)

        // Retry up to 3 times with increasing delays
        if (retryCount < 3) {
          const delay = (retryCount + 1) * 1000 // 1s, 2s, 3s
          setTimeout(() => refreshUserData(retryCount + 1), delay)
        } else {
          toast.error('Payment processed, but there was an issue refreshing your account. Please contact support if credits don\'t appear shortly.')
          setLoading(false)
        }
      }
    }

    // Start checking after a short delay for webhook processing
    const timer = setTimeout(() => refreshUserData(), 500)

    return () => clearTimeout(timer)
  }, [refreshCredits])

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  const handleViewSubscription = () => {
    navigate('/subscription')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Activating Your Subscription...</h2>
              <p className="text-muted-foreground">
                Your payment was successful! We're updating your credits and activating your subscription.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
          <CardDescription>
            Thank you for subscribing to VibeBoost. Your subscription is now active.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Your credits have been updated and you can now start generating amazing images!
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoToDashboard}
              className="w-full"
              size="lg"
            >
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={handleViewSubscription}
              variant="outline"
              className="w-full"
            >
              Manage Subscription
            </Button>
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Need help? <a href="mailto:support@vibeboost.com" className="text-primary hover:underline">Contact Support</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SubscriptionSuccess