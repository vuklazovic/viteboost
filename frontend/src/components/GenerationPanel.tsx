import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  ZoomIn
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { GenerationDetails, getGenerationDetails, downloadImage } from '@/lib/api';
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

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown date';
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
      <SheetContent className="w-full sm:max-w-4xl p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="p-6 border-b bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div>
                  <SheetTitle className="text-xl">
                    {generation?.original_filename || 'Loading...'}
                  </SheetTitle>
                  {generation && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Generated {formatDate(generation.created_at)}</span>
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
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onToggleFavorite?.(generationId)}
                    variant="ghost"
                    size="sm"
                    className={isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''}
                  >
                    {isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(generationId, 'Generation ID')}
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleDownloadAll}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download All
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6">
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
                <div className="space-y-8">
                  {/* Generation Info */}
                  <Card className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Generation Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ID:</span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {generationId.slice(0, 12)}...
                            </code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{formatDate(generation.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Images:</span>
                            <Badge variant="secondary">{generation.generated_images.length}</Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Original File</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Filename:</span>
                            <span className="truncate max-w-32">{generation.original_filename}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge className="bg-green-500/10 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <Button
                            onClick={() => copyToClipboard(window.location.href, 'Share link')}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                          <Button
                            onClick={handleDownloadAll}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download All
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Generated Images */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold">Generated Images</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setSelectedImageIndex(null)}
                          variant={selectedImageIndex === null ? "default" : "outline"}
                          size="sm"
                        >
                          <Grid3X3 className="h-4 w-4 mr-2" />
                          Grid View
                        </Button>
                      </div>
                    </div>

                    {/* Image Gallery */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {generation.generated_images.map((image, index) => {
                        const styleInfo = getStyleInfo(image.style, index);
                        return (
                          <Card
                            key={image.filename}
                            className="group overflow-hidden hover:shadow-strong transition-all duration-300"
                          >
                            {/* Image */}
                            <div
                              className="aspect-square relative overflow-hidden cursor-pointer"
                              onClick={() => setSelectedImageIndex(index)}
                            >
                              <img
                                src={image.url}
                                alt={`AI Generated ${image.style}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                              />

                              {/* Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              {/* Quick Actions */}
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(image.url, '_blank');
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedImageIndex(index);
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                                  >
                                    <Maximize2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Style Badge */}
                              <div className="absolute top-4 left-4">
                                <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                                  {styleInfo.icon} {styleInfo.name}
                                </Badge>
                              </div>

                              {/* Index Badge */}
                              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm">
                                  #{index + 1}
                                </Badge>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-foreground mb-1">
                                    {styleInfo.name} Style
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {styleInfo.subtitle}
                                  </p>
                                </div>

                                {/* AI Prompt */}
                                {image.description && (
                                  <div className="bg-muted/50 rounded-lg p-3 border">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        AI Prompt
                                      </span>
                                      <Button
                                        onClick={() => copyToClipboard(image.description, 'Prompt')}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {image.description}
                                    </p>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    onClick={() => handleDownload(image.filename, image.url)}
                                    disabled={downloadingId === image.filename}
                                    variant="default"
                                    size="sm"
                                    className="flex-1"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    {downloadingId === image.filename ? 'Downloading...' : 'Download'}
                                  </Button>
                                  <Button
                                    onClick={() => window.open(image.url, '_blank')}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
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