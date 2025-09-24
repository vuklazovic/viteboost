import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Download,
  ExternalLink,
  Calendar,
  ImageIcon,
  RefreshCw,
  AlertCircle,
  Copy,
  Star,
  StarOff,
  X,
  Maximize2,
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [visibleImagesCount, setVisibleImagesCount] = useState(20);
  const imageRef = useRef<HTMLImageElement>(null);

  const { numImages, credits, costPerImage, updateCredits, refreshCreditsImmediate } = useAuth();
  const queryClient = useQueryClient();

  const minSwipeDistance = 50;

  const moreLikeThisMutation = useMutation({
    mutationFn: ({ imageUrl, style, quantity }: { imageUrl: string; style: string; quantity: number }) =>
      generateSimilarImages(imageUrl, style, quantity),
    onMutate: ({ quantity }) => {
      const cost = (costPerImage || 1) * quantity;
      if ((credits ?? 0) >= cost) {
        const newCredits = (credits ?? 0) - cost;
        updateCredits(newCredits);
      }
    },
    onSuccess: (result, { quantity }) => {
      if (typeof result.credits === 'number') {
        updateCredits(result.credits);
      } else {
        refreshCreditsImmediate();
      }
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      toast.success(`✨ Generated ${result.generated_images.length} similar images!`);
    },
    onError: (error, { quantity }) => {
      const cost = (costPerImage || 1) * quantity;
      const restoredCredits = (credits ?? 0) + cost;
      updateCredits(restoredCredits);
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

  useEffect(() => {
    setSelectedImageIndex(null);
    setVisibleImagesCount(20);
  }, [generationId]);

  useEffect(() => {
    if (!isOpen || !generation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedImageIndex, generation, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !generation || selectedImageIndex === null) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedImageIndex < generation.generated_images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }

    if (isRightSwipe && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
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

  const handleDownloadAll = async () => {
    if (!generation?.generated_images) return;

    const images = generation.generated_images;
    toast.info(`📦 Downloading ${images.length} images...`);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      setTimeout(() => {
        handleDownload(image.filename, image.url);
      }, i * 500);
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
    const cost = (costPerImage || 1) * (numImages || 1);
    if ((credits ?? 0) < cost) {
      toast.error(`Not enough credits. Need ${cost}, you have ${credits}.`);
      return;
    }

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
      <SheetContent className="!w-full !max-w-none md:!max-w-3xl lg:!max-w-5xl p-0" side="right">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 md:p-6 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg md:text-xl truncate">
                    {generation?.original_filename || 'Loading...'}
                  </SheetTitle>
                  {generation && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="truncate">{formatDate(generation.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4" />
                        <span>{generation.generated_images.length} images</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {generation && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onToggleFavorite?.(generationId)}
                    variant="ghost"
                    size="sm"
                    className={`h-9 w-9 p-0 ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''}`}
                  >
                    {isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(generationId, 'Generation ID')}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleDownloadAll}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download All</span>
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 md:p-6">
              {isLoading && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="aspect-square w-full" />
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
                <div className="space-y-6">
                  {selectedImageIndex !== null ? (
                    <div className="space-y-4">
                      <div
                        className="relative bg-black rounded-xl overflow-hidden shadow-strong"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                      >
                        <div className="relative w-full min-h-[50vh] md:min-h-[60vh] max-h-[70vh] flex items-center justify-center">
                          <img
                            ref={imageRef}
                            src={generation.generated_images[selectedImageIndex].url}
                            alt={`Generated image ${selectedImageIndex + 1}`}
                            className="w-full h-auto max-h-[70vh] object-contain transition-transform duration-300"
                          />

                          {generation.generated_images.length > 1 && (
                            <>
                              <Button
                                onClick={() => setSelectedImageIndex(
                                  selectedImageIndex > 0 ? selectedImageIndex - 1 : generation.generated_images.length - 1
                                )}
                                variant="secondary"
                                size="sm"
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-9 w-9 md:h-10 md:w-10 p-0 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md shadow-medium"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </Button>
                              <Button
                                onClick={() => setSelectedImageIndex(
                                  selectedImageIndex < generation.generated_images.length - 1 ? selectedImageIndex + 1 : 0
                                )}
                                variant="secondary"
                                size="sm"
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-9 w-9 md:h-10 md:w-10 p-0 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md shadow-medium"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            </>
                          )}

                          <div className="absolute top-3 left-3 md:top-4 md:left-4">
                            <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                              {selectedImageIndex + 1} of {generation.generated_images.length}
                            </Badge>
                          </div>

                          <Button
                            onClick={() => setSelectedImageIndex(null)}
                            variant="secondary"
                            size="sm"
                            className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 p-0 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Card className="p-4 md:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">
                              {getStyleInfo(generation.generated_images[selectedImageIndex].style, selectedImageIndex).name} Style
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Variation #{selectedImageIndex + 1}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <Button
                              onClick={() => handleDownload(
                                generation.generated_images[selectedImageIndex].filename,
                                generation.generated_images[selectedImageIndex].url
                              )}
                              disabled={downloadingId === generation.generated_images[selectedImageIndex].filename}
                              variant="outline"
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              {downloadingId === generation.generated_images[selectedImageIndex].filename ? 'Downloading...' : 'Download'}
                            </Button>

                            <Button
                              onClick={() => handleMoreLikeThis(
                                generation.generated_images[selectedImageIndex].url,
                                generation.generated_images[selectedImageIndex].style
                              )}
                              disabled={moreLikeThisMutation.isPending || (credits ?? 0) < ((costPerImage || 1) * (numImages || 1))}
                              variant="default"
                              className="gap-2 bg-gradient-primary"
                            >
                              {moreLikeThisMutation.isPending ? (
                                <RotateCcw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              {moreLikeThisMutation.isPending ? 'Generating...' : 'More Like This'}
                            </Button>
                          </div>
                        </div>
                      </Card>

                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {generation.generated_images.slice(
                          Math.max(0, selectedImageIndex - 5),
                          Math.min(generation.generated_images.length, selectedImageIndex + 6)
                        ).map((image, idx) => {
                          const actualIndex = Math.max(0, selectedImageIndex - 5) + idx;
                          return (
                            <button
                              key={image.filename}
                              onClick={() => setSelectedImageIndex(actualIndex)}
                              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                actualIndex === selectedImageIndex
                                  ? 'border-primary ring-2 ring-primary/20 scale-105'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <img
                                src={image.url}
                                alt={`Thumbnail ${actualIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {actualIndex === selectedImageIndex && (
                                <div className="absolute inset-0 bg-primary/20" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {generation.generated_images.slice(0, visibleImagesCount).map((image, index) => {
                        const styleInfo = getStyleInfo(image.style, index);
                        return (
                          <Card
                            key={image.filename}
                            className="group overflow-hidden hover:shadow-strong transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <div className="aspect-square relative overflow-hidden">
                              <img
                                src={image.url}
                                alt={`Generated image ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              <div className="absolute top-2 left-2">
                                <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm text-xs">
                                  {styleInfo.icon} {styleInfo.name}
                                </Badge>
                              </div>

                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(image.filename, image.url);
                                  }}
                                  variant="secondary"
                                  size="sm"
                                  className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-medium"
                                  disabled={downloadingId === image.filename}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                                  #{index + 1}
                                </div>
                              </div>

                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-medium">
                                  <Maximize2 className="h-5 w-5 text-gray-800" />
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>

                    {visibleImagesCount < generation.generated_images.length && (
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={() => setVisibleImagesCount(prev => Math.min(prev + 20, generation.generated_images.length))}
                          variant="outline"
                          className="gap-2"
                        >
                          Load More ({generation.generated_images.length - visibleImagesCount} remaining)
                        </Button>
                      </div>
                    )}
                    </>
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