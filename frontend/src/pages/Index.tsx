import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ShowcaseSection from "@/components/ShowcaseSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  const handleTryNow = () => {
    window.scrollTo(0, 0);
    navigate("/generate");
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
 
      </main>
      <Footer />
    </div>
  );
};

export default Index;
