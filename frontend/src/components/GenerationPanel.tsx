import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Download,
  ExternalLink,
  ArrowLeft,
  Calendar,
  ImageIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Copy,
  Share2,
  Star,
  StarOff,
  X,
  MoreVertical,
  Grid3X3,
  Maximize2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GenerationDetails, getGenerationDetails, downloadImage, generateSimilarImages } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

interface GenerationPanelProps {
  generationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (generationId: string) => void;
  isFavorite?: boolean;
}

const GenerationPanel = ({
  generationId,
  isOpen,
  onClose,
  onToggleFavorite,
  isFavorite = false
}: GenerationPanelProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const { numImages, credits, costPerImage, updateCredits, refreshCreditsImmediate } = useAuth();
  const queryClient = useQueryClient();

  // More Like This mutation
  const moreLikeThisMutation = useMutation({
    mutationFn: ({ imageUrl, style, quantity }: { imageUrl: string; style: string; quantity: number }) =>
      generateSimilarImages(imageUrl, style, quantity),
    onMutate: ({ quantity }) => {
      // Deduct credits immediately
      const cost = (costPerImage || 1) * quantity;
      if ((credits ?? 0) >= cost) {
        const newCredits = (credits ?? 0) - cost;
        updateCredits(newCredits);
      }
    },
    onSuccess: (result, { quantity }) => {
      // Update credits with actual remaining amount from server
      if (typeof result.credits === 'number') {
        updateCredits(result.credits);
      } else {
        refreshCreditsImmediate();
      }

      // Invalidate generations to refresh the list
      queryClient.invalidateQueries({ queryKey: ['generations'] });

      toast.success(`✨ Generated ${result.generated_images.length} similar images!`);
    },
    onError: (error, { quantity }) => {
      // Restore credits on failure
      const cost = (costPerImage || 1) * quantity;
      const restoredCredits = (credits ?? 0) + cost;
      updateCredits(restoredCredits);

      // Error handling
      if (error.response?.status === 402) {
        toast.error('❌ Insufficient credits. Please refresh and try again.');
      } else {
        toast.error('❌ Generation failed. Please try again.');
      }

      refreshCreditsImmediate();
    }
  });

  const {
    data: generation,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['generation', generationId],
    queryFn: () => generationId ? getGenerationDetails(generationId) : null,
    enabled: !!generationId && isOpen,
    refetchOnWindowFocus: false
  });

  // Reset selected image when generation changes
  useEffect(() => {
    setSelectedImageIndex(null);
  }, [generationId]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !generation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keys when the panel is open
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          if (selectedImageIndex !== null) {
            setSelectedImageIndex(null);
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          if (selectedImageIndex !== null && generation.generated_images.length > 1) {
            event.preventDefault();
            setSelectedImageIndex(
              selectedImageIndex > 0 ? selectedImageIndex - 1 : generation.generated_images.length - 1
            );
          }
          break;
        case 'ArrowRight':
          if (selectedImageIndex !== null && generation.generated_images.length > 1) {
            event.preventDefault();
            setSelectedImageIndex(
              selectedImageIndex < generation.generated_images.length - 1 ? selectedImageIndex + 1 : 0
            );
          }
          break;
        case 'Enter':
        case ' ':
          if (selectedImageIndex === null && generation.generated_images.length > 0) {
            event.preventDefault();
            setSelectedImageIndex(0);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedImageIndex, generation, onClose]);


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

  const handleDownloadAll = async () => {
    if (!generation?.generated_images) return;

    const images = generation.generated_images;
    toast.info(`📦 Downloading ${images.length} images...`);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        // Add delay between downloads to avoid overwhelming the browser
        setTimeout(() => {
          handleDownload(image.filename, image.url);
        }, i * 500);
      } catch (error) {
        console.error(`Failed to download ${image.filename}:`, error);
      }
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`📋 ${label} copied to clipboard!`);
    } catch (error) {
      toast.error('❌ Failed to copy to clipboard');
    }
  };

  const handleMoreLikeThis = (imageUrl: string, style: string) => {
    // Check if user has enough credits
    const cost = (costPerImage || 1) * (numImages || 1);
    if ((credits ?? 0) < cost) {
      toast.error(`Not enough credits. Need ${cost}, you have ${credits}.`);
      return;
    }

    // Trigger the mutation
    moreLikeThisMutation.mutate({
      imageUrl,
      style,
      quantity: numImages || 1
    });

    toast.info(`🎨 Generating ${numImages} similar images...`);
  };

  const getStyleInfo = (style: string, index: number) => {
    const styleIcons = ['🛍️', '📸', '📋', '🎨', '🚀', '🎆', '🌈', '💫', '✨', '🎯'];
    const styleNames = ['E-Commerce', 'Social Media', 'Catalog', 'Artistic', 'Dynamic', 'Premium', 'Lifestyle', 'Minimalist', 'Luxury', 'Editorial'];

    if (style.startsWith('style_')) {
      const styleNumber = parseInt(style.split('_')[1]) - 1;
      return {
        icon: styleIcons[styleNumber % styleIcons.length],
        name: styleNames[styleNumber % styleNames.length],
        subtitle: `Variation #${styleNumber + 1}`
      };
    }

    return {
      icon: styleIcons[index % styleIcons.length],
      name: style,
      subtitle: 'AI-generated image'
    };
  };

  if (!isOpen || !generationId) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="!w-full !max-w-none md:!max-w-3xl lg:!max-w-4xl p-0" side="right">
        <div className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="p-3 sm:p-4 md:p-6 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg sm:text-xl truncate">
                    {generation?.original_filename || 'Loading...'}
                  </SheetTitle>
                  {generation && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="truncate">Generated {formatDate(generation.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        <span>{generation.generated_images.length} images</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Header Actions */}
              {generation && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    onClick={() => onToggleFavorite?.(generationId)}
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 sm:h-10 sm:w-10 p-0 ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''}`}
                  >
                    {isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(generationId, 'Generation ID')}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 sm:h-10 sm:w-10 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleDownloadAll}
                    variant="outline"
                    size="sm"
                    className="gap-1 sm:gap-2 px-2 sm:px-4"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download All</span>
                    <span className="sm:hidden">All</span>
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1 w-full">
            <div className="p-2 sm:p-4 md:p-6 w-full max-w-full box-border">
              {isLoading && (
                <div className="space-y-6">
                  <Skeleton className="h-8 w-64" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="aspect-square w-full" />
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <Card className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Failed to load generation</h3>
                      <p className="text-muted-foreground mb-4">
                        There was an error loading the generation details.
                      </p>
                      <Button onClick={() => refetch()} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {generation && (
                <div className="space-y-8 w-full">

                  {/* Gallery Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold">Gallery</h3>
                      <Badge variant="secondary" className="text-sm">
                        {generation.generated_images.length} images
                      </Badge>
                    </div>
                  </div>

                  {/* Main Gallery */}
                  {selectedImageIndex !== null ? (
                    /* Lightbox View */
                    <div className="space-y-6">
                      {/* Current Image Display */}
                      <div className="relative bg-black mx-1 sm:mx-2 rounded-lg overflow-hidden">
                        {/* Mobile responsive image container */}
                        <div className="relative w-full max-w-[calc(100vw-16px)] sm:max-w-[calc(100vw-32px)] max-h-[min(60vh,calc(100dvh-200px))] md:h-auto lg:aspect-video md:max-h-[70vh] flex items-center justify-center">
                            <img
                              src={generation.generated_images[selectedImageIndex].url}
                              alt={`Generated image ${selectedImageIndex + 1}`}
                              className="w-full h-auto max-h-full object-contain"
                            />

                            {/* Navigation Arrows */}
                            {generation.generated_images.length > 1 && (
                              <>
                                <Button
                                  onClick={() => setSelectedImageIndex(
                                    selectedImageIndex > 0 ? selectedImageIndex - 1 : generation.generated_images.length - 1
                                  )}
                                  variant="secondary"
                                  size="sm"
                                  className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 p-0 bg-black/80 hover:bg-black/95 text-white border-0 backdrop-blur-sm z-50 shadow-lg"
                                >
                                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                </Button>
                                <Button
                                  onClick={() => setSelectedImageIndex(
                                    selectedImageIndex < generation.generated_images.length - 1 ? selectedImageIndex + 1 : 0
                                  )}
                                  variant="secondary"
                                  size="sm"
                                  className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 p-0 bg-black/80 hover:bg-black/95 text-white border-0 backdrop-blur-sm z-50 shadow-lg"
                                >
                                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                </Button>
                              </>
                            )}

                            {/* Image Counter */}
                            <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                              <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm text-xs sm:text-sm">
                                {selectedImageIndex + 1} of {generation.generated_images.length}
                              </Badge>
                            </div>

                            {/* Close Lightbox */}
                            <Button
                              onClick={() => setSelectedImageIndex(null)}
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2 sm:top-4 sm:right-4 h-8 w-8 sm:h-10 sm:w-10 p-0 bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm z-30"
                            >
                              <X className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </div>
                      </div>

                      {/* Current Image Actions */}
                      <div className="p-3 sm:p-4 md:p-6 mx-1 sm:mx-2 bg-card rounded-lg border max-w-[calc(100vw-16px)] sm:max-w-[calc(100vw-32px)] box-border">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full max-w-full">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-semibold text-base md:text-lg">
                                {getStyleInfo(generation.generated_images[selectedImageIndex].style, selectedImageIndex).name} Style
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Variation #{selectedImageIndex + 1}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 md:flex-row md:gap-3 w-full md:w-auto max-w-full">
                            <Button
                              onClick={() => handleDownload(
                                generation.generated_images[selectedImageIndex].filename,
                                generation.generated_images[selectedImageIndex].url
                              )}
                              disabled={downloadingId === generation.generated_images[selectedImageIndex].filename}
                              variant="outline"
                              className="gap-2 w-full md:w-auto text-sm"
                            >
                              <Download className="h-4 w-4 shrink-0" />
                              <span className="truncate">
                                {downloadingId === generation.generated_images[selectedImageIndex].filename ? 'Downloading...' : 'Download'}
                              </span>
                            </Button>

                            {/* More Like This Button */}
                            <Button
                              onClick={() => handleMoreLikeThis(
                                generation.generated_images[selectedImageIndex].url,
                                generation.generated_images[selectedImageIndex].style
                              )}
                              disabled={moreLikeThisMutation.isPending || (credits ?? 0) < ((costPerImage || 1) * (numImages || 1))}
                              variant="default"
                              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 w-full md:w-auto text-sm"
                            >
                              {moreLikeThisMutation.isPending ? (
                                <RotateCcw className="h-4 w-4 animate-spin shrink-0" />
                              ) : (
                                <Sparkles className="h-4 w-4 shrink-0" />
                              )}
                              <span className="truncate">
                                {moreLikeThisMutation.isPending ? 'Generating...' : 'More Like This'}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Thumbnail Strip */}
                      <div className="flex gap-2 sm:gap-3 justify-center overflow-x-auto pb-2 px-2 sm:px-4 md:px-6">
                        {generation.generated_images.map((image, index) => (
                          <button
                            key={image.filename}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              index === selectedImageIndex
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {index === selectedImageIndex && (
                              <div className="absolute inset-0 bg-primary/20" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Grid View */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4 w-full max-w-full box-border">
                      {generation.generated_images.map((image, index) => {
                        const styleInfo = getStyleInfo(image.style, index);
                        return (
                          <Card
                            key={image.filename}
                            className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer w-full max-w-full"
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <div className="h-32 sm:h-auto sm:aspect-square relative overflow-hidden">
                              <img
                                src={image.url}
                                alt={`Generated image ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              {/* Style Badge */}
                              <div className="absolute top-1 left-1 sm:top-2 sm:left-2 md:top-3 md:left-3">
                                <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm text-xs max-w-full truncate">
                                  {styleInfo.icon} {styleInfo.name}
                                </Badge>
                              </div>

                              {/* Index */}
                              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 md:bottom-3 md:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                                  #{index + 1}
                                </div>
                              </div>

                              {/* View Icon */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                                  <Maximize2 className="h-6 w-6 text-gray-800" />
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GenerationPanel;
