import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab)

  const handleSwitchToRegister = () => {
    setActiveTab('register')
  }

  const handleSwitchToLogin = () => {
    setActiveTab('login')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Join thousands of creators transforming their product images'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {activeTab === 'login' ? (
            <LoginForm onSwitchToRegister={handleSwitchToRegister} onSuccess={onClose} />
          ) : (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} onSuccess={onClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}