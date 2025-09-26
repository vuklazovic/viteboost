import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-products.png";

interface HeroSectionProps {
  onTryNow?: () => void;
}

const HeroSection = ({ onTryNow }: HeroSectionProps) => {
  return (
    <section className="bg-gradient-hero min-h-[90vh] flex items-center">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-glow/20 rounded-full text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                AI-Powered Image Enhancement
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Turn boring product photos into
                <span className="bg-gradient-primary bg-clip-text text-transparent"> sales machines</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Upload any product photo and get 20+ stunning variations in seconds.
                Perfect for Instagram, Amazon, catalogs, and ads. No photographer needed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="premium"
                size="lg"
                className="text-lg px-8 py-6"
                onClick={onTryNow}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Generating
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">2M+</div>
                <div className="text-sm text-muted-foreground">Photos Transformed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Brands Trust Us</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">3 sec</div>
                <div className="text-sm text-muted-foreground">Magic Happens</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="Professional product photography showcase"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;