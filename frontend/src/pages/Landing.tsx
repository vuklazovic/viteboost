import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/hooks/useAuthModal";
import { AuthModal } from "@/components/auth/AuthModal";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ShowcaseSection from "@/components/ShowcaseSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const authModal = useAuthModal();

  const handleTryNow = () => {
    if (isAuthenticated) {
      navigate("/generate");
    } else {
      authModal.openLogin();
    }
  };

  const handleGenerateClick = () => {
    if (isAuthenticated) {
      navigate("/generate");
    } else {
      authModal.openLogin();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection onTryNow={handleTryNow} />
        <ShowcaseSection onTryNow={handleTryNow} />
        <FeaturesSection onTryNow={handleTryNow} />
        <TestimonialsSection />
        <PricingSection onTryNow={handleTryNow} />
        
        {/* Call to Action Section */}
        <section className="py-24 bg-gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Ready to transform your products?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using AI to create stunning product images that convert.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6"
                  onClick={handleGenerateClick}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Generating
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.closeModal}
        defaultTab={authModal.defaultTab}
      />
    </div>
  );
};

export default Landing;
