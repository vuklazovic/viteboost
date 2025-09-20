import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

interface ImageUploadProps {
  onImagesGenerated: (images: any[]) => void
  onGeneratingStart: () => void
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesGenerated, onGeneratingStart }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { session, isAuthenticated } = useAuth()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  const handleUploadAndGenerate = async () => {
    if (!uploadedFile || !isAuthenticated || !session) {
      setError('Please sign in to upload and generate images')
      return
    }

    setIsUploading(true)
    setError(null)
    onGeneratingStart()

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      // Upload with auth token
      const uploadResponse = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${session.access_token}`
        },
      })

      const { file_id } = uploadResponse.data

      // Generate with auth token
      const generateResponse = await axios.post(`${API_BASE_URL}/generate`, null, {
        params: { file_id },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const generatedImages = generateResponse.data.generated_images.map((img: any) => ({
        ...img,
        url: `${API_BASE_URL}${img.url}`
      }))

      onImagesGenerated(generatedImages)
    } catch (error) {
      console.error('Error generating images:', error)
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError('Authentication failed. Please sign in again.')
        } else if (error.response?.status === 403) {
          setError('Access denied. You may not own this file.')
        } else {
          setError(error.response?.data?.detail || 'Failed to generate images')
        }
      } else {
        setError('Failed to generate images. Please check that the backend is running.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <h2 className="section-title">Upload Your Product Image</h2>
      
      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          {uploadedFile && previewUrl ? (
            <div className="slide-up">
              <img
                src={previewUrl}
                alt="Preview"
                className="preview-image"
              />
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                {uploadedFile.name}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                ✨ Ready to generate AI variations
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
                {isDragActive ? '🎯' : '📸'}
              </div>
              <p style={{ fontSize: '1.4rem', marginBottom: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {isDragActive ? 'Drop your product image here!' : 'Upload Your Product Image'}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>
                Drag & drop or click to browse
              </p>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'var(--background-light)', 
                padding: '0.5rem 1rem', 
                borderRadius: 'var(--radius-lg)', 
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
              }}>
                <span>📁</span>
                Supports JPG, PNG, WebP up to 10MB
              </div>
            </div>
          )}
        </div>
      </div>

      {uploadedFile && (
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-generate"
            onClick={handleUploadAndGenerate}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <span className="spinner" style={{ width: '20px', height: '20px', margin: '0', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white' }}></span>
                AI is Working...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate AI Marketing Images
              </>
            )}
          </button>
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: 'var(--background-light)', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-light)'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              🎯 <strong>What happens next:</strong>
            </p>
            <ul style={{ 
              color: 'var(--text-muted)', 
              fontSize: '0.85rem', 
              paddingLeft: '1rem',
              lineHeight: '1.5'
            }}>
              <li>AI analyzes your product image</li>
              <li>Creates dynamic, contextual prompts</li>
              <li>Generates variations in parallel for speed</li>
              <li>Delivers professional marketing-ready images</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload