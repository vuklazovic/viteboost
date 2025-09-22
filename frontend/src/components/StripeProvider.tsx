import React from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Rb16KDApD6mGm7q2O5pkiPKaODXtvRpkSphnv4k3gMD9JhKSMGJRi22LaioyHuYy30yeuv3qVDVmkuL36sVmCV200Xsrbsv0w')

interface StripeProviderProps {
  children: React.ReactNode
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
}