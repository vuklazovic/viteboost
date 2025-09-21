import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileImage,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle,
  X,
  Link,
  Clipboard,
  Camera,
  FolderOpen,
  RotateCcw,
  Play,
  Pause,
  Trash2
} from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadAndGenerateImages, GeneratedImage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'generating' | 'completed' | 'error';
  progress: number;
  generatedImages?: GeneratedImage[];
  error?: string;
}

interface EnhancedUploadZoneProps {
  onImagesGenerated?: (images: GeneratedImage[], uploadId: string) => void;
  onQueueUpdate?: (queue: UploadItem[]) => void;
  compact?: boolean;
}

const EnhancedUploadZone = ({
  onImagesGenerated,
  onQueueUpdate,
  compact = false
}: EnhancedUploadZoneProps) => {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const { refreshCredits, refreshCreditsImmediate, updateCredits, costPerImage, numImages, credits } = useAuth();

  // Generate images mutation
  const generateImagesMutation = useMutation({
    mutationFn: uploadAndGenerateImages,
    onMutate: (file) => {
      const uploadId = Math.random().toString(36).substring(7);
      const newItem: UploadItem = {
        id: uploadId,
        file,
        preview: URL.createObjectURL(file),
        status: 'uploading',
        progress: 0
      };

      setUploadQueue(prev => {
        const updated = [...prev, newItem];
        onQueueUpdate?.(updated);
        return updated;
      });

      // Simulate progress
      const interval = setInterval(() => {
        setUploadQueue(prev => {
          const updated = prev.map(item =>
            item.id === uploadId
              ? { ...item, progress: Math.min(item.progress + Math.random() * 15, 90) }
              : item
          );
          onQueueUpdate?.(updated);
          return updated;
        });
      }, 300);

      return { uploadId, interval };
    },
    onSuccess: (result, file, context) => {
      if (context?.interval) {
        clearInterval(context.interval);
      }

      const uploadId = context?.uploadId;
      if (uploadId) {
        setUploadQueue(prev => {
          const updated = prev.map(item =>
            item.id === uploadId
              ? {
                  ...item,
                  status: 'completed' as const,
                  progress: 100,
                  generatedImages: result.images
                }
              : item
          );
          onQueueUpdate?.(updated);
          return updated;
        });

        onImagesGenerated?.(result.images, uploadId);
        toast.success(`✨ Generated ${result.images.length} variations!`);
      }

      // Update credits
      if (typeof result.credits === 'number') {
        updateCredits(result.credits);
      } else {
        refreshCreditsImmediate();
      }
    },
    onError: (error, file, context) => {
      if (context?.interval) {
        clearInterval(context.interval);
      }

      const uploadId = context?.uploadId;
      if (uploadId) {
        setUploadQueue(prev => {
          const updated = prev.map(item =>
            item.id === uploadId
              ? {
                  ...item,
                  status: 'error' as const,
                  progress: 0,
                  error: error.message || 'Generation failed'
                }
              : item
          );
          onQueueUpdate?.(updated);
          return updated;
        });
      }

      // Restore credits on failure
      const cost = (costPerImage || 1) * (numImages || 1);
      const restoredCredits = (credits ?? 0) + cost;
      updateCredits(restoredCredits);

      // Error handling
      if (error.response?.status === 402) {
        toast.error('❌ Insufficient credits. Please refresh and try again.');
      } else if (error.response?.status === 400) {
        toast.error('❌ Invalid request. Please check your image and try again.');
      } else {
        toast.error('❌ Generation failed. Please try again.');
      }

      refreshCreditsImmediate();
    }
  });

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    // Handle file rejections
    fileRejections.forEach((rejection) => {
      rejection.errors.forEach((error: any) => {
        let errorMessage = '';
        switch (error.code) {
          case 'file-invalid-type':
            errorMessage = 'Please select a valid image file (JPG, PNG, or WEBP)';
            break;
          case 'file-too-large':
            errorMessage = 'File is too large. Please select an image smaller than 10MB';
            break;
          case 'too-many-files':
            errorMessage = 'Please select only one image at a time';
            break;
          default:
            errorMessage = 'File upload failed. Please try a different image';
        }
        toast.error(`❌ ${errorMessage}`);
      });
    });

    // Process accepted files
    acceptedFiles.forEach(file => {
      const cost = (costPerImage || 1) * (numImages || 1);
      if ((credits ?? 0) < cost) {
        toast.error(`Not enough credits. Need ${cost}, you have ${credits}.`);
        return;
      }

      // Deduct credits immediately
      const newCredits = (credits ?? 0) - cost;
      updateCredits(newCredits);

      generateImagesMutation.mutate(file);
    });
  }, [generateImagesMutation, credits, costPerImage, numImages, updateCredits]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    noClick: true // We'll handle clicks manually
  });

  // URL upload handling
  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;

    try {
      const response = await fetch(urlInput);
      const blob = await response.blob();
      const file = new File([blob], 'uploaded-image.jpg', { type: blob.type });

      const cost = (costPerImage || 1) * (numImages || 1);
      if ((credits ?? 0) < cost) {
        toast.error(`Not enough credits. Need ${cost}, you have ${credits}.`);
        return;
      }

      // Deduct credits immediately
      const newCredits = (credits ?? 0) - cost;
      updateCredits(newCredits);

      generateImagesMutation.mutate(file);
      setUrlInput('');
      setIsUrlModalOpen(false);
    } catch (error) {
      toast.error('❌ Failed to load image from URL');
    }
  };

  // Paste handling
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const file = new File([blob], 'pasted-image.png', { type: blob.type });

            const cost = (costPerImage || 1) * (numImages || 1);
            if ((credits ?? 0) < cost) {
              toast.error(`Not enough credits. Need ${cost}, you have ${credits}.`);
              return;
            }

            // Deduct credits immediately
            const newCredits = (credits ?? 0) - cost;
            updateCredits(newCredits);

            generateImagesMutation.mutate(file);
            toast.success('📋 Image pasted and uploaded!');
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [generateImagesMutation, credits, costPerImage, numImages, updateCredits]);

  // Remove item from queue
  const removeFromQueue = (id: string) => {
    setUploadQueue(prev => {
      const updated = prev.filter(item => item.id !== id);
      onQueueUpdate?.(updated);
      return updated;
    });
  };

  // Retry failed upload
  const retryUpload = (id: string) => {
    const item = uploadQueue.find(q => q.id === id);
    if (!item) return;

    const cost = (costPerImage || 1) * (numImages || 1);
    if ((credits ?? 0) < cost) {
      toast.error(`Not enough credits. Need ${cost}, you have ${credits}.`);
      return;
    }

    // Deduct credits immediately
    const newCredits = (credits ?? 0) - cost;
    updateCredits(newCredits);

    // Reset item status
    setUploadQueue(prev => {
      const updated = prev.map(q =>
        q.id === id
          ? { ...q, status: 'pending' as const, progress: 0, error: undefined }
          : q
      );
      onQueueUpdate?.(updated);
      return updated;
    });

    generateImagesMutation.mutate(item.file);
  };

  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'uploading':
      case 'generating':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'error':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'uploading':
      case 'generating':
        return <Sparkles className="h-4 w-4 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <Card className="p-4">
        <div {...getRootProps()} className="space-y-4">
          <input {...getInputProps()} />

          {/* Compact Upload Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button
              onClick={() => setIsUrlModalOpen(true)}
              variant="outline"
              size="sm"
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigator.clipboard && toast.info('📋 Paste an image anywhere!')}
              variant="outline"
              size="sm"
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>

          {/* Queue Items */}
          {uploadQueue.length > 0 && (
            <div className="space-y-2">
              {uploadQueue.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg">
                  <img
                    src={item.preview}
                    alt="Upload preview"
                    className="w-10 h-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(item.status)} text-xs`}>
                        {getStatusIcon(item.status)}
                        {item.status}
                      </Badge>
                    </div>
                    {(item.status === 'uploading' || item.status === 'generating') && (
                      <Progress value={item.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    {item.status === 'error' && (
                      <Button
                        onClick={() => retryUpload(item.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      onClick={() => removeFromQueue(item.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              onDrop(files, []);
            }
          }}
          className="hidden"
        />

        {/* URL Modal */}
        {isUrlModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
              <h3 className="font-semibold mb-4">Upload from URL</h3>
              <div className="space-y-4">
                <Input
                  ref={urlInputRef}
                  placeholder="Paste image URL here..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlUpload()}
                />
                <div className="flex gap-2">
                  <Button onClick={handleUrlUpload} className="flex-1">
                    Upload
                  </Button>
                  <Button
                    onClick={() => setIsUrlModalOpen(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>
    );
  }

  // Full upload zone for main view
  return (
    <div className="space-y-6">
      {/* Main Drop Zone */}
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed transition-all duration-300 overflow-hidden ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-105 shadow-strong'
            : 'border-border hover:border-primary/50 hover:shadow-medium'
        }`}
      >
        <div className="p-12 text-center">
          <input {...getInputProps()} />

          <div className="space-y-6">
            <div className={`w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto transition-transform duration-300 ${
              isDragActive ? 'scale-110' : ''
            }`}>
              <Upload className="h-12 w-12 text-white" />
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">
                {isDragActive ? 'Drop it like it\'s hot! 🔥' : 'Drag & Drop Your Product Image'}
              </h3>
              <p className="text-muted-foreground text-lg">
                or use one of the quick upload methods below
              </p>
            </div>

            {/* Upload Methods */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="hero"
                size="lg"
                className="text-lg px-8 py-4"
              >
                <FileImage className="h-5 w-5" />
                Choose File
                <ArrowRight className="h-5 w-5" />
              </Button>

              <Button
                onClick={() => setIsUrlModalOpen(true)}
                variant="outline"
                size="lg"
                className="px-6 py-4"
              >
                <Link className="h-5 w-5" />
                From URL
              </Button>

              <Button
                onClick={() => {
                  navigator.clipboard && toast.info('📋 Paste an image anywhere on this page!');
                }}
                variant="outline"
                size="lg"
                className="px-6 py-4"
              >
                <Clipboard className="h-5 w-5" />
                Paste
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                JPG, PNG, WEBP
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                Up to 10MB
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                {(costPerImage || 1) * (numImages || 1)} credits per image
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upload Queue</h3>
            <Badge variant="secondary">{uploadQueue.length}</Badge>
          </div>

          <div className="space-y-4">
            {uploadQueue.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-xl">
                <img
                  src={item.preview}
                  alt="Upload preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium truncate">{item.file.name}</h4>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground mb-2">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>

                  {(item.status === 'uploading' || item.status === 'generating') && (
                    <div className="space-y-2">
                      <Progress value={item.progress} className="w-full h-2" />
                      <p className="text-xs text-muted-foreground">
                        {item.status === 'uploading' ? 'Uploading...' : 'Generating variations...'}
                      </p>
                    </div>
                  )}

                  {item.status === 'completed' && item.generatedImages && (
                    <p className="text-sm text-green-600">
                      ✨ Generated {item.generatedImages.length} variations
                    </p>
                  )}

                  {item.status === 'error' && item.error && (
                    <p className="text-sm text-red-600">❌ {item.error}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {item.status === 'error' && (
                    <Button
                      onClick={() => retryUpload(item.id)}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}

                  <Button
                    onClick={() => removeFromQueue(item.id)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            onDrop(files, []);
          }
        }}
        className="hidden"
      />

      {/* URL Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold mb-6">Upload from URL</h3>
            <div className="space-y-6">
              <Input
                ref={urlInputRef}
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlUpload()}
                className="text-lg py-3"
              />
              <div className="flex gap-3">
                <Button onClick={handleUrlUpload} className="flex-1" size="lg">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload & Generate
                </Button>
                <Button
                  onClick={() => setIsUrlModalOpen(false)}
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedUploadZone;