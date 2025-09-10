import React from 'react'

interface GeneratedImage {
  filename: string
  url: string
  style: string
  description: string
}

interface ImageGalleryProps {
  images: GeneratedImage[]
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const getStyleInfo = (style: string, index: number) => {
    const styleIcons = ['🛍️', '📸', '📋', '🎨', '🚀', '🎆', '🌈', '💫', '✨', '🎯'];
    const styleNames = ['E-Commerce', 'Social Media', 'Catalog', 'Artistic', 'Dynamic', 'Premium', 'Lifestyle', 'Minimalist', 'Luxury', 'Editorial'];
    
    if (style.startsWith('style_')) {
      const styleNumber = parseInt(style.split('_')[1]) - 1;
      return {
        label: `${styleIcons[styleNumber % styleIcons.length]} ${styleNames[styleNumber % styleNames.length]} Style`,
        subtitle: `AI-generated variation #${styleNumber + 1}`
      };
    }
    
    // Legacy support for old style names
    switch (style) {
      case 'ecommerce':
        return {
          label: '🛍️ E-Commerce Style',
          subtitle: 'Perfect for online stores and product catalogs'
        }
      case 'instagram':
        return {
          label: '📸 Instagram Style',
          subtitle: 'Trendy lifestyle shots for social media'
        }
      case 'catalog':
        return {
          label: '📋 Catalog Style',
          subtitle: 'Professional documentation and brochures'
        }
      default:
        return {
          label: `${styleIcons[index % styleIcons.length]} ${style}`,
          subtitle: 'AI-generated marketing image'
        }
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    }
  }

  return (
    <div className="container">
      <div className="gallery">
        {images.map((image, index) => {
          const styleInfo = getStyleInfo(image.style, index)
          return (
            <div key={index} className="image-card slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <img src={image.url} alt={`Generated ${image.style}`} className="image-card-image" />
              <div className="image-card-content">
                <h3 className="image-card-title">{styleInfo.label}</h3>
                <p className="image-card-description">{styleInfo.subtitle}</p>
                {image.description && (
                  <div className="image-card-prompt">
                    <strong>AI Prompt:</strong> {image.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn"
                    onClick={() => handleDownload(image.url, image.filename)}
                    style={{ flex: 1 }}
                  >
                    <span>💾</span>
                    Download
                  </button>
                  <button
                    className="btn btn-secondary tooltip"
                    data-tooltip="Open in new tab"
                    onClick={() => window.open(image.url, '_blank')}
                    style={{ padding: '0.875rem' }}
                  >
                    <span>🔗</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {images.length > 0 && (
        <div className="glass-card" style={{ 
          textAlign: 'center', 
          marginTop: '3rem', 
          marginBottom: '3rem',
          padding: '2rem',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>💡</span>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Pro Tips</h3>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <strong>🚀 Marketing:</strong> Use different styles for various platforms and campaigns
            </div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <strong>🎯 A/B Testing:</strong> Test multiple variations to see what converts best
            </div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <strong>📱 Social Media:</strong> Perfect for Instagram, Facebook, and TikTok content
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGallery