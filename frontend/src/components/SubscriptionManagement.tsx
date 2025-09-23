import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Loader2, CreditCard, Calendar, ExternalLink, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { SubscriptionPlansSimple } from './SubscriptionPlansSimple'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface SubscriptionData {
  subscription: {
    id: string
    stripe_customer_id: string
    stripe_subscription_id: string
    plan_id: string
    status: string
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
  } | null
  plan: {
    id: string
    name: string
    price: number
    credits: number
  }
  credits: {
    current: number
    last_reset: string | null
    next_reset: string | null
  }
}

export const SubscriptionManagement: React.FC = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showPlans, setShowPlans] = useState(false)
  const [authError, setAuthError] = useState(false)
  const { refreshCredits, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const handleNavigateToPricing = () => {
    if (window.location.pathname === '/') {
      // If on home page, scroll to pricing section
      const element = document.getElementById('pricing')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      // If on another page, navigate to home and scroll to pricing section
      navigate('/', { replace: false })
      setTimeout(() => {
        const element = document.getElementById('pricing')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSubscriptionStatus()
    } else {
      setLoading(false)
      setAuthError(true)
    }
  }, [isAuthenticated, user])

  const fetchSubscriptionStatus = async () => {
    try {
      setAuthError(false)
      const response = await axios.get('/subscriptions/status')
      setSubscriptionData(response.data)
    } catch (error: any) {
      console.error('Failed to fetch subscription status:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true)
        toast.error('Please log in to view subscription information')
      } else if (error.response?.status === 404) {
        // User has no subscription - they're on free plan
        setSubscriptionData({
          subscription: null,
          plan: {
            id: 'free',
            name: 'Free Plan',
            price: 0,
            credits: 3
          },
          credits: {
            current: 3,
            last_reset: null,
            next_reset: null
          }
        })
      } else {
        toast.error('Failed to load subscription information')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async (immediately: boolean = false) => {
    setActionLoading(true)
    try {
      await axios.post('/subscriptions/cancel', {
        at_period_end: !immediately
      })

      toast.success(
        immediately
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the billing period'
      )

      await fetchSubscriptionStatus()
      await refreshCredits()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to cancel subscription'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    setActionLoading(true)
    try {
      await axios.post('/subscriptions/reactivate')
      toast.success('Subscription reactivated successfully')
      await fetchSubscriptionStatus()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to reactivate subscription'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const openBillingPortal = async () => {
    try {
      const response = await axios.get('/subscriptions/billing-portal')
      window.open(response.data.url, '_blank')
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to open billing portal'
      toast.error(errorMessage)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${(price / 100).toFixed(2)}/month`
  }

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="destructive">Canceling</Badge>
    }

    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'trialing':
        return <Badge variant="secondary">Trial</Badge>
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>
      case 'canceled':
        return <Badge variant="outline">Canceled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (showPlans) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowPlans(false)}
          >
            ← Back to Subscription
          </Button>
        </div>
        <SubscriptionPlansSimple />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="text-center py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Authentication Required</h3>
              <p className="text-muted-foreground">
                Please log in with Google to view your subscription information.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subscriptionData) {
    return (
      <div className="text-center py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">You are on the Free Plan</h3>
              <p className="text-muted-foreground">
                You currently have access to the free plan with 15 credits per month.
              </p>
              <Button onClick={handleNavigateToPricing}>
                Upgrade to Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { subscription, plan, credits } = subscriptionData
  const isFreePlan = plan.id === 'free'
  const hasPaidSubscription = subscription && subscription.status === 'active'

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan: {plan.name}
              </CardTitle>
              <CardDescription>
                {formatPrice(plan.price)} • {plan.credits} credits per month
              </CardDescription>
            </div>
            {subscription && getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Credits</p>
              <p className="text-2xl font-bold">{credits.current}</p>
            </div>

            {credits.next_reset && (
              <div>
                <p className="text-sm font-medium text-gray-600">Next Credit Reset</p>
                <p className="text-sm">{formatDate(credits.next_reset)}</p>
              </div>
            )}

            {subscription?.current_period_end && (
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {subscription.cancel_at_period_end ? 'Ends On' : 'Renews On'}
                </p>
                <p className="text-sm">{formatDate(subscription.current_period_end)}</p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          {isFreePlan ? (
            <Button onClick={handleNavigateToPricing}>
              Upgrade Plan
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowPlans(true)}
              >
                Change Plan
              </Button>

              {hasPaidSubscription && (
                <Button
                  variant="outline"
                  onClick={openBillingPortal}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>

      {/* Subscription Actions */}
      {subscription && subscription.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Actions</CardTitle>
            <CardDescription>
              Manage your subscription settings
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {subscription.cancel_at_period_end ? (
              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div>
                  <p className="font-medium text-yellow-800">Subscription Canceling</p>
                  <p className="text-sm text-yellow-700">
                    Your subscription will end on {formatDate(subscription.current_period_end)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReactivateSubscription}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reactivate
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="justify-start">
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your subscription will continue until the end of your current billing period on{' '}
                      {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'your next billing date'}.
                      You'll keep your current credits and benefits until then. After that, you'll be downgraded to the free plan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelSubscription(false)}
                      disabled={actionLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}