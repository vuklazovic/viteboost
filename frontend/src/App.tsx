import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ImageUpload from './components/ImageUpload'
import ImageGallery from './components/ImageGallery'
import AuthModal from './components/AuthModal'

interface GeneratedImage {
  filename: string
  url: string
  style: string
  description: string
}

const AppContent: React.FC = () => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  
  const { user, logout, isAuthenticated, loading } = useAuth()

  const handleImagesGenerated = (images: GeneratedImage[]) => {
    setGeneratedImages(images)
    setIsGenerating(false)
  }

  const handleGeneratingStart = () => {
    setIsGenerating(true)
    setGeneratedImages([])
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">VibeBoost</h1>
            <div className="header-actions">
              {isAuthenticated ? (
                <div className="user-menu">
                  <span className="user-email">Welcome, {user?.email}</span>
                  <button onClick={logout} className="logout-button">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <button 
                    onClick={() => openAuthModal('login')}
                    className="auth-button-header login"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => openAuthModal('register')}
                    className="auth-button-header register"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>VibeBoost</h1>
            <p className="hero-subtitle">
              Transform your product photos into stunning marketing visuals with AI. 
              Generate professional variations instantly with dynamic prompts tailored to your product.
            </p>
            <div className="hero-features">
              <div className="hero-feature">
                <span>⚡</span> AI-Powered Analysis
              </div>
              <div className="hero-feature">
                <span>🎨</span> Dynamic Prompts
              </div>
              <div className="hero-feature">
                <span>🚀</span> Parallel Generation
              </div>
              <div className="hero-feature">
                <span>📱</span> Instant Download
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="hero-cta">
                <button 
                  onClick={() => openAuthModal('register')}
                  className="cta-button"
                >
                  Get Started Free
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {isAuthenticated ? (
          <>
            <div className="upload-section">
              <ImageUpload 
                onImagesGenerated={handleImagesGenerated}
                onGeneratingStart={handleGeneratingStart}
              />
            </div>

            {isGenerating && (
              <div className="loading fade-in">
                <div className="spinner"></div>
                <div className="loading-text">
                  AI is creating your marketing visuals...
                </div>
                <div className="loading-subtext">
                  Analyzing your product and generating dynamic prompts for the perfect marketing images
                </div>
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            )}

            {generatedImages.length > 0 && (
              <div className="fade-in">
                <h2 className="gallery-title">Your AI-Generated Marketing Images</h2>
                <ImageGallery images={generatedImages} />
              </div>
            )}
          </>
        ) : (
          <div className="auth-required">
            <div className="auth-required-content">
              <h2>Ready to Transform Your Product Photos?</h2>
              <p>Sign up for free to start generating stunning marketing visuals with AI</p>
              <div className="auth-required-buttons">
                <button 
                  onClick={() => openAuthModal('register')}
                  className="auth-button primary"
                >
                  Create Free Account
                </button>
                <button 
                  onClick={() => openAuthModal('login')}
                  className="auth-button secondary"
                >
                  Already have an account?
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App