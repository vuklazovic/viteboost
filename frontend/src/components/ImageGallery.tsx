import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Sparkles, Copy, Star, TrendingUp } from "lucide-react";
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
    
    // Legacy support
    switch (style) {
      case 'ecommerce':
        return {
          icon: '🛍️',
          name: 'E-Commerce',
          subtitle: 'Perfect for online stores',
          color: 'bg-blue-500/10 text-blue-700 border-blue-200'
        };
      case 'instagram':
        return {
          icon: '📸',
          name: 'Social Media', 
          subtitle: 'Great for social platforms',
          color: 'bg-pink-500/10 text-pink-700 border-pink-200'
        };
      case 'catalog':
        return {
          icon: '📋',
          name: 'Catalog',
          subtitle: 'Professional documentation',
          color: 'bg-green-500/10 text-green-700 border-green-200'
        };
      default:
        return {
          icon: styleIcons[index % styleIcons.length],
          name: style,
          subtitle: 'AI-generated image',
          color: styleColors[index % styleColors.length]
        };
    }
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      setDownloadingId(image.filename);
      await downloadImage(image.url, image.filename);
      toast.success(`🎉 Downloaded ${image.filename}!`);
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

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-secondary" data-section="results">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            AI Generation Complete
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Your images are
            <span className="bg-gradient-primary bg-clip-text text-transparent"> ready! 🚀</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {images.length} professional variations generated with AI precision.
            Each one designed to convert browsers into buyers.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {images.map((image, index) => {
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
                        onClick={() => handleDownload(image)}
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

        {/* Success Stats */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-gradient-primary text-white border-0 shadow-strong">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-300" />
                <h3 className="text-2xl font-bold">Success Metrics</h3>
                <Star className="w-6 h-6 text-yellow-300" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{images.length}</div>
                  <div className="text-white/90 text-sm">Professional Variations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">~3x</div>
                  <div className="text-white/90 text-sm">Expected Conversion Boost</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">$0</div>
                  <div className="text-white/90 text-sm">Photography Costs Saved</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Marketing Tips */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-strong overflow-hidden">
            <div className="bg-gradient-secondary p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-bold text-foreground">Pro Marketing Tips</h3>
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground">Maximize your sales potential with these strategies</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h4 className="font-bold mb-2 text-foreground">A/B Test Everything</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Test different styles across your marketing channels to find what converts best.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h4 className="font-bold mb-2 text-foreground">Multi-Platform Strategy</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use different variations for Instagram, Amazon, Facebook, and your website.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h4 className="font-bold mb-2 text-foreground">Seasonal Campaigns</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Perfect timing for holiday promotions, seasonal sales, and limited-time offers.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;