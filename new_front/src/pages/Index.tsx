import { useState } from "react";
import Hero from "@/components/Hero";
import ProductShowcase from "@/components/ProductShowcase";
import Features from "@/components/Features";
import UploadSection from "@/components/UploadSection";
import ImageGallery from "@/components/ImageGallery";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import { GeneratedImage } from "@/lib/api";

const Index = () => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleImagesGenerated = (images: GeneratedImage[]) => {
    setGeneratedImages(images);
  };

  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <ProductShowcase />
      <Features />
      <UploadSection onImagesGenerated={handleImagesGenerated} />
      {generatedImages.length > 0 && (
        <div data-section="results">
          <ImageGallery images={generatedImages} />
        </div>
      )}
      <Pricing />
      <Footer />
    </main>
  );
};

export default Index;
