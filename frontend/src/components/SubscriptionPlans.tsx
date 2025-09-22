import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PaymentForm } from './PaymentForm'
import { toast } from 'sonner'
import axios from 'axios'

interface Plan {
  id: string
  name: string
  price: number
  credits: number
  features: string[]
}

interface SubscriptionPlansProps {
  onSubscriptionCreated?: () => void
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onSubscriptionCreated }) => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [currentUserPlan, setCurrentUserPlan] = useState<string>('free')
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetchPlans()
    if (isAuthenticated) {
      fetchCurrentSubscription()
    }
  }, [isAuthenticated])

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/subscriptions/plans')
      setPlans(response.data.plans)
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error('Failed to load subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const response = await axios.get('/subscriptions/status')
      setCurrentUserPlan(response.data.plan.id)
    } catch (error) {
      console.error('Failed to fetch current subscription:', error)
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    if (!isAuthenticated) {
      toast.error('Please log in to subscribe to a plan')
      return
    }

    if (plan.id === 'free') {
      toast.info('You are already on the free plan')
      return
    }

    if (plan.id === 'enterprise') {
      toast.info('Enterprise plans require custom setup. Please contact our sales team.')
      return
    }

    if (plan.id === currentUserPlan) {
      toast.info('You are already subscribed to this plan')
      return
    }

    setSelectedPlan(plan)
    setShowPaymentForm(true)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false)
    setSelectedPlan(null)
    fetchCurrentSubscription()
    onSubscriptionCreated?.()
    toast.success('Subscription created successfully!')
  }

  const formatPrice = (price: number, planId: string) => {
    if (price === 0) return 'Free'
    if (price === null || planId === 'enterprise') return 'Custom pricing'
    return `$${(price / 100).toFixed(2)}/month`
  }

  const getPlanStatus = (planId: string) => {
    if (planId === currentUserPlan) {
      return 'current'
    }

    const planHierarchy = ['free', 'basic', 'pro', 'business', 'enterprise']
    const currentIndex = planHierarchy.indexOf(currentUserPlan)
    const planIndex = planHierarchy.indexOf(planId)

    if (planIndex > currentIndex) {
      return 'upgrade'
    } else if (planIndex < currentIndex) {
      return 'downgrade'
    }

    return 'available'
  }

  const getButtonText = (plan: Plan) => {
    const status = getPlanStatus(plan.id)

    if (plan.id === 'enterprise') {
      return 'Contact Sales'
    }

    switch (status) {
      case 'current':
        return 'Current Plan'
      case 'upgrade':
        return 'Upgrade'
      case 'downgrade':
        return 'Downgrade'
      default:
        return plan.id === 'free' ? 'Free Plan' : 'Subscribe'
    }
  }

  const getButtonVariant = (plan: Plan) => {
    const status = getPlanStatus(plan.id)
    return status === 'current' ? 'secondary' : 'default'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (showPaymentForm && selectedPlan) {
    return (
      <div className="max-w-md mx-auto">
        <PaymentForm
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setShowPaymentForm(false)
            setSelectedPlan(null)
          }}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {plans.map((plan) => {
        const status = getPlanStatus(plan.id)
        const isPopular = plan.id === 'pro'
        const isEnterprise = plan.id === 'enterprise'

        return (
          <Card key={plan.id} className={`relative ${status === 'current' ? 'border-green-500' : ''} ${isPopular ? 'border-blue-500' : ''} ${isEnterprise ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50' : ''}`}>
            {isPopular && !isEnterprise && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>
            )}
            {isEnterprise && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                Need More?
              </Badge>
            )}
            {status === 'current' && (
              <Badge className="absolute -top-2 right-4 bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Current
              </Badge>
            )}

            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold">{formatPrice(plan.price, plan.id)}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-4">
                <p className="text-lg font-semibold text-center">
                  {plan.id === 'enterprise' ? 'Custom allocation' : `${plan.credits} credits/month`}
                </p>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className={`w-full ${plan.id === 'enterprise' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                variant={plan.id === 'enterprise' ? 'default' : getButtonVariant(plan)}
                onClick={() => handleSelectPlan(plan)}
                disabled={status === 'current' || plan.id === 'free'}
              >
                {getButtonText(plan)}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}