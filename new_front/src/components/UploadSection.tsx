import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileImage, ArrowRight, Sparkles, Zap } from "lucide-react";
import { useState, useCallback } from "react";
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadAndGenerateImages, GeneratedImage } from '@/lib/api';

interface UploadSectionProps {
  onImagesGenerated?: (images: GeneratedImage[]) => void;
}

const UploadSection = ({ onImagesGenerated }: UploadSectionProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Generate images mutation
  const generateImagesMutation = useMutation({
    mutationFn: uploadAndGenerateImages,
    onMutate: () => {
      setProgress(0);
      toast.info('Starting AI image generation...');
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);
      
      return { interval };
    },
    onSuccess: (images, _, context) => {
      if (context?.interval) {
        clearInterval(context.interval);
      }
      setProgress(100);
      toast.success(`Generated ${images.length} professional images!`);
      onImagesGenerated?.(images);
      
      // Scroll to results
      setTimeout(() => {
        const resultsSection = document.querySelector('[data-section="results"]');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    },
    onError: (error, _, context) => {
      if (context?.interval) {
        clearInterval(context.interval);
      }
      setProgress(0);
      console.error('Generation failed:', error);
      toast.error('Failed to generate images. Please check your backend connection.');
    }
  });

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleGenerate = () => {
    if (!uploadedFile) return;
    generateImagesMutation.mutate(uploadedFile);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setProgress(0);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <section className="py-24 bg-background" data-section="upload">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Products?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your product image and watch AI create dozens of professional variations 
            in seconds. Start your free trial now.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className={`border-2 border-dashed transition-all duration-300 ${
            isDragActive ? 'border-primary bg-primary/5 scale-105' : 
            uploadedFile ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50'
          }`}>
            <CardContent className="p-8">
              {!uploadedFile ? (
                <div {...getRootProps()} className="cursor-pointer">
                  <input {...getInputProps()} />
                  <div className="text-center">
                    <div className="mb-6">
                      <div className={`w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 ${
                        isDragActive ? 'scale-110' : ''
                      }`}>
                        <Upload className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">
                        {isDragActive ? 'Drop Your Image Here!' : 'Upload Your Product Image'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Drag & drop or click to browse from your computer
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Button size="lg" variant="hero" className="w-full group">
                        <FileImage className="h-5 w-5 transition-transform group-hover:scale-110" />
                        Choose File to Upload
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                      
                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          JPG, PNG, WEBP
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Up to 10MB
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          AI Powered
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-6">
                    <div className="relative inline-block">
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="w-64 h-64 object-cover rounded-xl shadow-strong"
                      />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-xl font-semibold mb-1">{uploadedFile.name}</h3>
                      <p className="text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for AI transformation
                      </p>
                    </div>
                  </div>

                  {generateImagesMutation.isPending ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="text-lg font-medium">
                          AI is analyzing and creating your images...
                        </span>
                      </div>
                      <Progress value={progress} className="w-full h-3" />
                      <p className="text-sm text-muted-foreground">
                        This may take 30-60 seconds. We're generating multiple professional variations with dynamic prompts.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button 
                        size="lg" 
                        variant="hero" 
                        className="w-full group"
                        onClick={handleGenerate}
                        disabled={generateImagesMutation.isPending}
                      >
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        Generate AI Marketing Images
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={resetUpload}
                        className="w-full"
                      >
                        Choose Different Image
                      </Button>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium text-sm mb-2">🎯 What happens next:</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• AI analyzes your product image</li>
                          <li>• Creates 10 dynamic, contextual prompts</li>
                          <li>• Generates variations in parallel for speed</li>
                          <li>• Delivers professional marketing-ready images</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Process Flow */}
          {!uploadedFile && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-105">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2 text-lg">1. Upload Image</h4>
                <p className="text-muted-foreground">
                  Drag & drop or select your product photo. We support JPG, PNG, and WEBP formats.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-105">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2 text-lg">2. AI Processing</h4>
                <p className="text-muted-foreground">
                  Our AI analyzes your product and generates dynamic prompts for multiple professional variations.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-105">
                  <FileImage className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold mb-2 text-lg">3. Download & Use</h4>
                <p className="text-muted-foreground">
                  Get professional marketing images ready for social media, e-commerce, and campaigns.
                </p>
              </div>
            </div>
          )}

          {/* Success State Stats */}
          {generateImagesMutation.isSuccess && (
            <div className="mt-12 text-center">
              <Card className="bg-gradient-primary text-white border-0 inline-block">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold mb-2">✨ Generation Complete!</h4>
                  <p className="text-white/90">
                    Successfully generated {generateImagesMutation.data?.length || 0} professional variations
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UploadSection;