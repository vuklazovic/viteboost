import { useState } from 'react'

export type AuthModalTab = 'login' | 'register'

export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultTab, setDefaultTab] = useState<AuthModalTab>('login')

  const openModal = (tab: AuthModalTab = 'login') => {
    setDefaultTab(tab)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  const openLogin = () => openModal('login')
  const openRegister = () => openModal('register')

  return {
    isOpen,
    defaultTab,
    openModal,
    closeModal,
    openLogin,
    openRegister
  }
}