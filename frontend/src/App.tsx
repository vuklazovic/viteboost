import React, { useState } from 'react'
import ImageUpload from './components/ImageUpload'
import ImageGallery from './components/ImageGallery'

interface GeneratedImage {
  filename: string
  url: string
  style: string
  description: string
}

function App() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleImagesGenerated = (images: GeneratedImage[]) => {
    setGeneratedImages(images)
    setIsGenerating(false)
  }

  const handleGeneratingStart = () => {
    setIsGenerating(true)
    setGeneratedImages([])
  }

  return (
    <div className="App">
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
          </div>
        </div>
      </div>

      <div className="container">
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
      </div>
    </div>
  )
}

export default App