import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, 
  Palette, 
  Download, 
  Smartphone, 
  ShoppingBag, 
  BarChart3,
  Sparkles,
  Clock
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast AI",
      description: "Get professional variations in under 30 seconds. No waiting, no delays."
    },
    {
      icon: Palette,
      title: "Smart Style Transfer",
      description: "Automatically adapts your products to different aesthetic styles and platforms."
    },
    {
      icon: Download,
      title: "High-Res Downloads",
      description: "Export in any size or format. From Instagram squares to billboard dimensions."
    },
    {
      icon: Smartphone,
      title: "Social Media Ready",
      description: "Perfect sizing for Instagram, Facebook, TikTok, Pinterest, and more."
    },
    {
      icon: ShoppingBag,
      title: "E-commerce Optimized",
      description: "Amazon, Shopify, WooCommerce compatible. Increase your conversion rates."
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track which variations perform best across your marketing channels."
    },
    {
      icon: Sparkles,
      title: "Background Magic",
      description: "Instantly remove, replace, or enhance backgrounds with AI precision."
    },
    {
      icon: Clock,
      title: "Batch Processing",
      description: "Upload multiple products and process them all simultaneously."
    }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Everything You Need to Scale Your Visuals
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powered by cutting-edge AI, designed for modern businesses. 
            Transform your product photography workflow in minutes.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-glow transition-all duration-300 border-border/50">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Stats Section */}
        <div className="mt-20 bg-gradient-hero rounded-3xl p-8 lg:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">2.5M+</div>
              <div className="text-muted-foreground">Images Processed</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">15sec</div>
              <div className="text-muted-foreground">Avg Processing</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Style Variations</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;