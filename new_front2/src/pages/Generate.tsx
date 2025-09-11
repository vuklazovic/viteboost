import { useState } from "react";
import Header from "@/components/Header";
import UploadSection from "@/components/UploadSection";
import ImageGallery from "@/components/ImageGallery";
import Footer from "@/components/Footer";
import { GeneratedImage } from "@/lib/api";

const Generate = () => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleImagesGenerated = (images: GeneratedImage[]) => {
    setGeneratedImages(images);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <UploadSection onImagesGenerated={handleImagesGenerated} />
        {generatedImages.length > 0 && (
          <ImageGallery images={generatedImages} />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Generate;