import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CheckCircle, Loader2, Star, Crown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import axios from 'axios'

interface Plan {
  id: string
  name: string
  price: number
  credits: number
  features: string[]
  payment_link?: string
}

export const SubscriptionPlansSimple: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetchPlans()
  }, [])

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

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === 'free') {
      if (!isAuthenticated) {
        toast.info('Please log in to start using the free plan')
        window.location.href = '/auth'
        return
      }
      toast.info('You are already on the free plan!')
      return
    }

    if (plan.id === 'enterprise') {
      toast.info('Enterprise plans require custom setup. Please contact our sales team.')
      return
    }

    if (!isAuthenticated) {
      toast.info('Please log in to subscribe to a plan')
      window.location.href = '/auth'
      return
    }

    // Redirect to Stripe payment link
    if (plan.payment_link) {
      window.open(plan.payment_link, '_blank')
    } else {
      toast.error('Payment link not available for this plan')
    }
  }

  const formatPrice = (price: number, planId: string) => {
    if (price === 0) return 'Free'
    if (price === null || planId === 'enterprise') return 'Custom pricing'
    return `$${(price / 100).toFixed(2)}/month`
  }

  const getButtonText = (plan: Plan) => {
    if (plan.id === 'enterprise') {
      return 'Contact Sales'
    }
    return plan.id === 'free' ? 'Get Started' : 'Subscribe'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {plans.map((plan) => {
        const isPopular = plan.id === 'pro'
        const isEnterprise = plan.id === 'enterprise'

        return (
          <Card key={plan.id} className={`relative ${isPopular ? 'border-blue-500 scale-105' : ''} ${isEnterprise ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50' : ''}`}>
            {isPopular && !isEnterprise && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            )}
            {isEnterprise && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                <Crown className="w-3 h-3 mr-1" />
                Need More?
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
                variant={plan.id === 'enterprise' ? 'default' : 'default'}
                onClick={() => handleSelectPlan(plan)}
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