import React, { useState } from 'react'
import Login from './Login'
import Register from './Register'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="auth-modal-backdrop" onClick={handleBackdropClick}>
      <div className="auth-modal">
        <button 
          className="auth-modal-close" 
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        
        {mode === 'login' ? (
          <Login 
            onSwitchToRegister={() => setMode('register')}
            onClose={onClose}
          />
        ) : (
          <Register 
            onSwitchToLogin={() => setMode('login')}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

export default AuthModal