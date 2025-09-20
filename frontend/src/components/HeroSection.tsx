import { Button } from "@/components/ui/button";
import { Upload, Sparkles, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/hooks/useAuthModal";
import { AuthModal } from "@/components/auth/AuthModal";
import heroImage from "@/assets/hero-products.jpg";

interface HeroSectionProps {
  onTryNow?: () => void;
}

const HeroSection = ({ onTryNow }: HeroSectionProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const authModal = useAuthModal();

  const handleStartCreating = () => {
    if (onTryNow) {
      onTryNow();
    } else {
      // Check if user is authenticated before navigating to generate
      if (isAuthenticated) {
        navigate('/generate');
      } else {
        authModal.openLogin();
      }
    }
  };

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
                variant="hero" 
                size="lg" 
                className="text-lg px-8 py-6 group"
                onClick={handleStartCreating}
              >
                <Upload className="h-5 w-5 transition-transform group-hover:scale-110" />
                Start Creating Now
              </Button>
              <Button variant="premium" size="lg" className="text-lg px-8 py-6 group">
                <Download className="h-5 w-5 transition-transform group-hover:scale-110" />
                See Examples
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
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-strong">
              <img 
                src={heroImage} 
                alt="Professional product photography showcase" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl"></div>
            <div className="absolute -inset-4 bg-gradient-primary opacity-10 rounded-3xl blur-xl"></div>
          </div>
        </div>
      </div>
      
      {/* Only show modal if onTryNow is not provided (fallback behavior) */}
      {!onTryNow && (
        <AuthModal
          isOpen={authModal.isOpen}
          onClose={authModal.closeModal}
          defaultTab={authModal.defaultTab}
        />
      )}
    </section>
  );
};

export default HeroSection;