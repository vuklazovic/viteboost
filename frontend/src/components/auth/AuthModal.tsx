import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"
import { ForgotPasswordForm } from "./ForgotPasswordForm"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register' | 'forgot-password'
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot-password'>(defaultTab)

  const handleSwitchToRegister = () => {
    setActiveTab('register')
  }

  const handleSwitchToLogin = () => {
    setActiveTab('login')
  }

  const handleSwitchToForgotPassword = () => {
    setActiveTab('forgot-password')
  }

  const getTitle = () => {
    switch (activeTab) {
      case 'login':
        return 'Welcome back'
      case 'register':
        return 'Create your account'
      case 'forgot-password':
        return 'Reset your password'
      default:
        return 'Welcome back'
    }
  }

  const getDescription = () => {
    switch (activeTab) {
      case 'login':
        return 'Sign in to your account to continue'
      case 'register':
        return 'Join thousands of creators transforming their product images'
      case 'forgot-password':
        return 'Enter your email to receive a password reset link'
      default:
        return 'Sign in to your account to continue'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {activeTab === 'login' && (
            <LoginForm 
              onSwitchToRegister={handleSwitchToRegister} 
              onSwitchToForgotPassword={handleSwitchToForgotPassword}
              onSuccess={onClose} 
            />
          )}
          
          {activeTab === 'register' && (
            <RegisterForm 
              onSwitchToLogin={handleSwitchToLogin} 
              onSuccess={onClose} 
            />
          )}
          
          {activeTab === 'forgot-password' && (
            <ForgotPasswordForm 
              onBackToLogin={handleSwitchToLogin}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}