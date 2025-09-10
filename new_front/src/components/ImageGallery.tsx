import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { GeneratedImage, downloadImage } from "@/lib/api";

interface ImageGalleryProps {
  images: GeneratedImage[];
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const getStyleInfo = (style: string, index: number) => {
    const styleIcons = ['🛍️', '📸', '📋', '🎨', '🚀', '🎆', '🌈', '💫', '✨', '🎯'];
    const styleNames = ['E-Commerce', 'Social Media', 'Catalog', 'Artistic', 'Dynamic', 'Premium', 'Lifestyle', 'Minimalist', 'Luxury', 'Editorial'];
    const styleColors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-pink-100 text-pink-700 border-pink-200', 
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-teal-100 text-teal-700 border-teal-200',
      'bg-gray-100 text-gray-700 border-gray-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200'
    ];
    
    if (style.startsWith('style_')) {
      const styleNumber = parseInt(style.split('_')[1]) - 1;
      return {
        label: `${styleIcons[styleNumber % styleIcons.length]} ${styleNames[styleNumber % styleNames.length]}`,
        subtitle: `AI-generated variation #${styleNumber + 1}`,
        color: styleColors[styleNumber % styleColors.length]
      };
    }
    
    // Legacy support
    switch (style) {
      case 'ecommerce':
        return {
          label: '🛍️ E-Commerce',
          subtitle: 'Perfect for online stores',
          color: 'bg-blue-100 text-blue-700 border-blue-200'
        };
      case 'instagram':
        return {
          label: '📸 Social Media', 
          subtitle: 'Great for social platforms',
          color: 'bg-pink-100 text-pink-700 border-pink-200'
        };
      case 'catalog':
        return {
          label: '📋 Catalog',
          subtitle: 'Professional documentation',
          color: 'bg-green-100 text-green-700 border-green-200'
        };
      default:
        return {
          label: `${styleIcons[index % styleIcons.length]} ${style}`,
          subtitle: 'AI-generated image',
          color: styleColors[index % styleColors.length]
        };
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      setDownloadingId(image.filename);
      await downloadImage(image.url, image.filename);
      toast.success(`Downloaded ${image.filename}`);
    } catch (error) {
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy prompt');
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            AI Generation Complete
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Your Marketing Images Are Ready
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {images.length} professional variations generated with dynamic AI prompts. 
            Perfect for social media, e-commerce, and marketing campaigns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image, index) => {
            const styleInfo = getStyleInfo(image.style, index);
            return (
              <Card 
                key={image.filename} 
                className="group overflow-hidden hover:shadow-strong transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={image.url}
                    alt={`AI Generated ${image.style}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Quick Actions Overlay */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                        onClick={() => window.open(image.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${styleInfo.color} border font-medium`}>
                      {styleInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {styleInfo.subtitle}
                  </p>

                  {image.description && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          AI Prompt
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyPrompt(image.description)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {image.description}
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full gap-2"
                    onClick={() => handleDownload(image)}
                    disabled={downloadingId === image.filename}
                  >
                    <Download className="h-4 w-4" />
                    {downloadingId === image.filename ? 'Downloading...' : 'Download'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pro Tips */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-gradient-primary text-white border-0">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">💡 Pro Marketing Tips</h3>
                <p className="text-white/90">Make the most of your AI-generated images</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h4 className="font-semibold mb-2">A/B Testing</h4>
                  <p className="text-sm text-white/90">
                    Test different styles across platforms to see what converts best
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h4 className="font-semibold mb-2">Multi-Platform</h4>
                  <p className="text-sm text-white/90">
                    Use different variations for Instagram, Facebook, Amazon, and more
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h4 className="font-semibold mb-2">Seasonal Campaigns</h4>
                  <p className="text-sm text-white/90">
                    Perfect for holiday promotions and seasonal marketing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;