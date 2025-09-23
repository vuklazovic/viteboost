import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import {
  Download,
  ExternalLink,
  Sparkles,
  Copy,
  ArrowLeft,
  Calendar,
  ImageIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GenerationDetails, getGenerationDetails, downloadImage } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface GenerationViewerProps {
  generationId: string;
  onBack?: () => void;
}

const GenerationViewer = ({ generationId, onBack }: GenerationViewerProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const {
    data: generation,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['generation', generationId],
    queryFn: () => getGenerationDetails(generationId),
    enabled: !!generationId,
    refetchOnWindowFocus: false
  });


  const getStyleInfo = (style: string, index: number) => {
    const styleIcons = ['🛍️', '📸', '📋', '🎨', '🚀', '🎆', '🌈', '💫', '✨', '🎯'];
    const styleNames = ['E-Commerce', 'Social Media', 'Catalog', 'Artistic', 'Dynamic', 'Premium', 'Lifestyle', 'Minimalist', 'Luxury', 'Editorial'];
    const styleColors = [
      'bg-blue-500/10 text-blue-700 border-blue-200',
      'bg-pink-500/10 text-pink-700 border-pink-200',
      'bg-green-500/10 text-green-700 border-green-200',
      'bg-purple-500/10 text-purple-700 border-purple-200',
      'bg-orange-500/10 text-orange-700 border-orange-200',
      'bg-indigo-500/10 text-indigo-700 border-indigo-200',
      'bg-teal-500/10 text-teal-700 border-teal-200',
      'bg-gray-500/10 text-gray-700 border-gray-200',
      'bg-amber-500/10 text-amber-700 border-amber-200',
      'bg-emerald-500/10 text-emerald-700 border-emerald-200'
    ];

    if (style.startsWith('style_')) {
      const styleNumber = parseInt(style.split('_')[1]) - 1;
      return {
        icon: styleIcons[styleNumber % styleIcons.length],
        name: styleNames[styleNumber % styleNames.length],
        subtitle: `Variation #${styleNumber + 1}`,
        color: styleColors[styleNumber % styleColors.length]
      };
    }

    return {
      icon: styleIcons[index % styleIcons.length],
      name: style,
      subtitle: 'AI-generated image',
      color: styleColors[index % styleColors.length]
    };
  };

  const handleDownload = async (filename: string, url: string) => {
    try {
      setDownloadingId(filename);
      await downloadImage(url, filename);
      toast.success(`🎉 Downloaded ${filename}!`);
    } catch (error) {
      toast.error('❌ Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('📋 Prompt copied to clipboard!');
    } catch (error) {
      toast.error('❌ Failed to copy prompt');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <div className="container mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Gallery Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-md mx-auto text-center">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to load generation details. Please try again.
              </AlertDescription>
            </Alert>
            <div className="mt-6 space-y-3">
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              {onBack && (
                <Button onClick={onBack} variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Timeline
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!generation) {
    return (
      <div className="py-12 px-4">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">Generation not found</p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Timeline
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button onClick={onBack} variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {generation.original_filename}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Generated {formatDate(generation.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>{generation.generated_images.length} images</span>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                generation.generated_images.forEach((image, index) => {
                  setTimeout(() => handleDownload(image.filename, image.url), index * 500);
                });
              }}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>

        {/* Images Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {generation.generated_images.map((image, index) => {
            const styleInfo = getStyleInfo(image.style, index);
            return (
              <Card
                key={image.filename}
                className="group overflow-hidden shadow-medium hover:shadow-strong transition-all duration-500 hover:-translate-y-2 border-0"
              >
                {/* Image Container */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={image.url}
                    alt={`AI Generated ${image.style}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Quick Actions Overlay */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-medium"
                        onClick={() => window.open(image.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Style Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className={`${styleInfo.color} border font-semibold backdrop-blur-sm`}>
                      {styleInfo.icon} {styleInfo.name}
                    </Badge>
                  </div>

                  {/* Index Badge */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                      #{index + 1}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground mb-1">
                        {styleInfo.name} Style
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {styleInfo.subtitle}
                      </p>
                    </div>

                    {/* AI Prompt */}
                    {image.description && (
                      <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI Prompt
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-primary/10"
                            onClick={() => copyPrompt(image.description)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-3">
                          {image.description}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 font-semibold"
                        onClick={() => handleDownload(image.filename, image.url)}
                        disabled={downloadingId === image.filename}
                        variant="cta"
                      >
                        <Download className="h-4 w-4" />
                        {downloadingId === image.filename ? 'Downloading...' : 'Download'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* No images fallback */}
        {generation.generated_images.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Images Generated</h3>
            <p className="text-muted-foreground">
              This generation doesn't have any images yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationViewer;