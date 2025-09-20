import { Wand2, Palette, Download, Zap, ShoppingBag, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Enhancement",
    description: "Our advanced AI automatically improves lighting, colors, and composition for stunning results."
  },
  {
    icon: Palette,
    title: "Multiple Style Variants",
    description: "Get your product in different backgrounds, styles, and color schemes automatically."
  },
  {
    icon: Download,
    title: "Instant Downloads",
    description: "Download high-resolution images ready for any platform in seconds."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Process images in under 3 seconds. No more waiting hours for edits."
  },
  {
    icon: ShoppingBag,
    title: "E-commerce Ready",
    description: "Perfect for product catalogs, Amazon listings, and online stores."
  },
  {
    icon: Share2,
    title: "Social Media Optimized",
    description: "Get perfectly sized images for Instagram, Facebook, TikTok, and more."
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Why settle for basic when you can have
            <span className="bg-gradient-primary bg-clip-text text-transparent"> extraordinary?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop wasting money on expensive photographers. Our AI creates magazine-quality results instantly.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;