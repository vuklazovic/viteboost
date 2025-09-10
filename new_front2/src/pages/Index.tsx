import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ShowcaseSection from "@/components/ShowcaseSection";
import FeaturesSection from "@/components/FeaturesSection";
import UploadSection from "@/components/UploadSection";
import ImageGallery from "@/components/ImageGallery";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { GeneratedImage } from "@/lib/api";

const Index = () => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleImagesGenerated = (images: GeneratedImage[]) => {
    setGeneratedImages(images);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ShowcaseSection />
        <FeaturesSection />
        <UploadSection onImagesGenerated={handleImagesGenerated} />
        {generatedImages.length > 0 && (
          <ImageGallery images={generatedImages} />
        )}
        <TestimonialsSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
