import React, { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Loader2, CreditCard, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

interface Plan {
  id: string
  name: string
  price: number
  credits: number
}

interface PaymentFormProps {
  plan: Plan
  onSuccess: () => void
  onCancel: () => void
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe not loaded yet. Please try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      toast.error('Card element not found')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (stripeError) {
        setError(stripeError.message || 'An error occurred')
        return
      }

      if (!paymentMethod) {
        setError('Failed to create payment method')
        return
      }

      // Create subscription
      const response = await axios.post('/subscriptions/create', {
        plan_id: plan.id,
        payment_method_id: paymentMethod.id,
      })

      const { client_secret, status } = response.data.subscription

      if (status === 'requires_payment_method') {
        setError('Your card was declined. Please try a different payment method.')
        return
      }

      if (status === 'requires_action') {
        // Handle 3D Secure authentication
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(client_secret)

        if (confirmError) {
          setError(confirmError.message || 'Payment confirmation failed')
          return
        }

        if (paymentIntent?.status === 'succeeded') {
          onSuccess()
        } else {
          setError('Payment was not successful')
        }
      } else if (status === 'active' || status === 'trialing') {
        onSuccess()
      } else {
        setError('Subscription creation failed')
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      const errorMessage = error.response?.data?.detail || 'Payment failed. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscribe to {plan.name}
            </CardTitle>
            <CardDescription>
              {formatPrice(plan.price)}/month • {plan.credits} credits
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Card Information
            </label>
            <div className="border rounded-md p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Billing:</strong> You will be charged {formatPrice(plan.price)} immediately
              and then monthly on the same date. Your credits will be renewed to {plan.credits}
              each billing cycle.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Subscribe for ${formatPrice(plan.price)}/month`
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}