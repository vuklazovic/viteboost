import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileImage, ArrowRight, Sparkles, Zap, CheckCircle, AlertCircle, X } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadAndGenerateImages, GeneratedImage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface UploadSectionProps {
  onImagesGenerated?: (images: GeneratedImage[]) => void;
}

const UploadSection = ({ onImagesGenerated }: UploadSectionProps) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const { refreshCredits, refreshCreditsImmediate, updateCredits, costPerImage, numImages, credits } = useAuth();

  // Generate images mutation
  const generateImagesMutation = useMutation({
    mutationFn: uploadAndGenerateImages,
    onMutate: () => {
      setProgress(0);
      toast.info('🚀 Starting AI image generation...');
      
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
    onSuccess: (result, _, context) => {
      if (context?.interval) {
        clearInterval(context.interval);
      }
      setProgress(100);
      toast.success(`✨ Generated ${result.images.length} stunning variations!`);
      onImagesGenerated?.(result.images);
      
      // Update credits directly from response if available
      if (typeof result.credits === 'number') {
        updateCredits(result.credits);
      } else {
        // Fallback to refreshing credits immediately if not in response
        refreshCreditsImmediate();
      }
      
      // Scroll to results
      setTimeout(() => {
        const resultsSection = document.querySelector('[data-section="results"]');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    },
    onError: (error, variables, context) => {
      if (context?.interval) {
        clearInterval(context.interval);
      }
      setProgress(0);
      console.error('Generation failed:', error);
      
      // Restore credits on failure (add back what we deducted)
      const cost = (costPerImage || 1) * (numImages || 1);
      const restoredCredits = (credits ?? 0) + cost;
      updateCredits(restoredCredits);
      
      // Handle specific error types
      if (error.response?.status === 402) {
        toast.error('❌ Insufficient credits. Please refresh and try again.');
      } else if (error.response?.status === 400) {
        toast.error('❌ Invalid request. Please check your image and try again.');
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        toast.error('❌ Cannot connect to server. Please check your connection.');
      } else {
        toast.error('❌ Generation failed. Please try again.');
      }
      
      // Refresh credits immediately to get accurate count after error
      refreshCreditsImmediate();
    }
  });

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    console.log('Files dropped/selected:', acceptedFiles);
    console.log('File rejections:', fileRejections);
    console.log('Accepted files length:', acceptedFiles.length);
    
    // Clear any previous errors
    setFileError(null);
    
    const file = acceptedFiles[0];
    if (file) {
      console.log('File selected:', file.name, file.size, file.type);
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      console.log('File state updated');
    } else {
      console.log('No file selected');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (fileRejections) => {
      console.log('Files rejected:', fileRejections);
      fileRejections.forEach((rejection) => {
        console.log('Rejection reason:', rejection.errors);
        rejection.errors.forEach((error) => {
          console.log('Error code:', error.code, 'Error message:', error.message);
          
          // Set user-friendly error messages
          let errorMessage = '';
          switch (error.code) {
            case 'file-invalid-type':
              errorMessage = 'Please select a valid image file (JPG, PNG, or WEBP)';
              break;
            case 'file-too-large':
              errorMessage = 'File is too large. Please select an image smaller than 10MB';
              break;
            case 'file-too-small':
              errorMessage = 'File is too small. Please select a larger image';
              break;
            case 'too-many-files':
              errorMessage = 'Please select only one image at a time';
              break;
            default:
              errorMessage = 'File upload failed. Please try a different image';
          }
          
          setFileError(errorMessage);
          toast.error(`❌ ${errorMessage}`);
        });
      });
    }
  });

  const handleGenerate = () => {
    console.log('Generate button clicked, uploadedFile:', uploadedFile);
    if (!uploadedFile) {
      console.log('No file to generate');
      return;
    }
    const cost = (costPerImage || 1) * (numImages || 1);
    if ((credits ?? 0) < cost) {
      toast.error(`Not enough credits. Need ${cost}, you have ${credits}. Please purchase more credits or wait for them to refresh.`);
      return;
    }
    
    // Instantly deduct credits for immediate UI feedback
    const newCredits = (credits ?? 0) - cost;
    updateCredits(newCredits);
    
    console.log('Starting image generation...');
    generateImagesMutation.mutate(uploadedFile);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setFileError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <section className="py-24 bg-gradient-hero" data-section="upload">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            Transform Your Products Now
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Upload. Generate. 
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Dominate.</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Drop your product image below and watch AI create professional variations 
            that'll make your competitors jealous. Takes less than 60 seconds.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* File Error Alert */}
          {fileError && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="flex items-center justify-between">
                  <span>{fileError}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFileError(null)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!uploadedFile ? (
            <Card className={`border-2 border-dashed transition-all duration-300 overflow-hidden ${
              isDragActive ? 
                'border-primary bg-primary/5 scale-105 shadow-strong' : 
                'border-border hover:border-primary/50 hover:shadow-medium'
            }`}>
              <div {...getRootProps()} className="cursor-pointer p-12 text-center">
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
                      or click to browse from your computer
                    </p>
                  </div>

                  <Button variant="hero" size="lg" className="text-lg px-12 py-6">
                    <FileImage className="h-5 w-5" />
                    Choose File to Upload
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  
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
                      AI Magic ✨
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden shadow-strong">
              <div className="p-8 text-center">
                <div className="space-y-6">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Upload preview"
                      className="w-80 h-80 object-cover rounded-2xl shadow-strong mx-auto"
                    />
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-medium">
                      <CheckCircle className="text-white w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">{uploadedFile.name}</h3>
                    <p className="text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for AI magic ✨
                    </p>
                  </div>

                  {generateImagesMutation.isPending ? (
                    <div className="space-y-6 max-w-md mx-auto">
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xl font-semibold text-foreground">
                          AI is creating magic... 🎨
                        </h4>
                        <Progress value={progress} className="w-full h-2" />
                        <p className="text-sm text-muted-foreground">
                          Analyzing your product • Generating dynamic prompts • Creating variations
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <Button 
                        variant="cta" 
                        size="lg" 
                        className="text-xl px-12 py-6"
                        onClick={handleGenerate}
                        disabled={generateImagesMutation.isPending || (credits ?? 0) < ((costPerImage || 1) * (numImages || 1))}
                      >
                        <Sparkles className="h-6 w-6 animate-pulse" />
                        Create AI Magic
                        <ArrowRight className="h-6 w-6" />
                      </Button>

                      <div className="text-sm text-muted-foreground">
                        Cost per run: <span className="font-medium text-foreground">{(costPerImage || 1) * (numImages || 1)} credits</span>
                        <span className="mx-2">•</span>
                        You have: <span className="font-medium text-foreground">{credits ?? 0}</span>
                        {(credits ?? 0) < ((costPerImage || 1) * (numImages || 1)) && (
                          <span className="ml-2 text-red-500">Not enough credits</span>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={resetUpload}
                        className="mx-4"
                      >
                        Choose Different Image
                      </Button>
                      
                      <Card className="p-6 bg-gradient-secondary border-0 max-w-md mx-auto">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          What happens next:
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-2 text-left">
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            AI analyzes your product in detail
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            Creates 10 dynamic, contextual prompts
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            Generates variations in parallel
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            Delivers sales-boosting images
                          </li>
                        </ul>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Process Flow - only show when no file uploaded */}
          {!uploadedFile && (
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <Upload className="h-10 w-10 text-primary" />
                </div>
                <h4 className="font-bold mb-3 text-xl text-foreground">1. Upload</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Drop your product photo. We support all major formats up to 10MB.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h4 className="font-bold mb-3 text-xl text-foreground">2. AI Magic</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Our AI analyzes and creates dynamic prompts for stunning variations.
                </p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                  <FileImage className="h-10 w-10 text-primary" />
                </div>
                <h4 className="font-bold mb-3 text-xl text-foreground">3. Dominate</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Download professional images that convert visitors into customers.
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {generateImagesMutation.isSuccess && (
            <div className="mt-12 text-center">
              <Card className="bg-gradient-primary text-white border-0 inline-block shadow-strong">
                <div className="p-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <CheckCircle className="w-8 h-8" />
                    <h4 className="text-2xl font-bold">Mission Complete! 🚀</h4>
                  </div>
                  <p className="text-white/90 text-lg">
                    Generated {generateImagesMutation.data?.length || 0} killer variations ready to boost your sales
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UploadSection;
