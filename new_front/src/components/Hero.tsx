import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="container mx-auto px-4 py-24 lg:py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Product Transformation
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
            Transform Your Products Into
            <span className="bg-gradient-primary bg-clip-text text-transparent block">
              Marketing Gold
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Upload one product image and get dozens of professional variations ready for social media, 
            catalogs, and marketing campaigns. No design skills required.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="hero" 
              className="gap-2 group"
              onClick={() => {
                const uploadSection = document.querySelector('[data-section="upload"]');
                uploadSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Upload className="h-5 w-5 transition-transform group-hover:scale-110" />
              Start Transforming Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="group">
              <span className="transition-transform group-hover:scale-105">Watch Demo</span>
            </Button>
          </div>
          
          {/* Social Proof */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground mb-8">
              Trusted by 10,000+ brands worldwide
            </p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold">Shopify</div>
              <div className="text-2xl font-bold">Amazon</div>
              <div className="text-2xl font-bold">Etsy</div>
              <div className="text-2xl font-bold">WooCommerce</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-primary opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-primary opacity-5 rounded-full blur-2xl"></div>
      </div>
    </section>
  );
};

export default Hero;