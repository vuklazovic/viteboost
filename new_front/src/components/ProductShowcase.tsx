import productWatch from "@/assets/product-watch.jpg";
import productSneakers from "@/assets/product-sneakers.jpg";
import productPhone from "@/assets/product-phone.jpg";
import productPerfume from "@/assets/product-perfume.jpg";

const ProductShowcase = () => {
  const transformations = [
    {
      original: productWatch,
      title: "Luxury Watch",
      variations: [
        "Social Media Post",
        "Instagram Story",
        "Product Catalog",
        "Banner Ad"
      ]
    },
    {
      original: productSneakers,
      title: "Designer Sneakers",
      variations: [
        "Lifestyle Shot",
        "E-commerce Listing",
        "Pinterest Pin",
        "Facebook Ad"
      ]
    },
    {
      original: productPhone,
      title: "Modern Smartphone",
      variations: [
        "Tech Blog Header",
        "Amazon Listing",
        "YouTube Thumbnail",
        "Press Release"
      ]
    },
    {
      original: productPerfume,
      title: "Luxury Perfume",
      variations: [
        "Elegant Poster",
        "Magazine Ad",
        "Store Display",
        "Gift Card Design"
      ]
    }
  ];

  return (
    <section className="py-24 bg-gradient-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            See VibeBoost in Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From single product shots to complete marketing campaigns. 
            Watch your products transform across all platforms.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {transformations.map((item, index) => (
            <div key={index} className="group">
              {/* Original Image */}
              <div className="relative overflow-hidden rounded-xl shadow-medium mb-4 bg-white">
                <img 
                  src={item.original} 
                  alt={item.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    Original
                  </span>
                </div>
              </div>
              
              {/* Transformation Arrow */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-8 h-0.5 bg-primary"></div>
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="w-8 h-0.5 bg-primary"></div>
                </div>
              </div>
              
              {/* Variations Grid */}
              <div className="grid grid-cols-2 gap-2">
                {item.variations.map((variation, vIndex) => (
                  <div key={vIndex} className="bg-white rounded-lg p-3 shadow-soft border border-border/50 hover:shadow-medium transition-shadow">
                    <div className="w-full h-16 bg-gradient-primary rounded mb-2 flex items-center justify-center">
                      <span className="text-white text-xs font-medium text-center">
                        AI Generated
                      </span>
                    </div>
                    <p className="text-xs font-medium text-center">{variation}</p>
                  </div>
                ))}
              </div>
              
              <h3 className="text-lg font-semibold text-center mt-4">{item.title}</h3>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 bg-white rounded-2xl px-8 py-4 shadow-medium">
            <span className="text-2xl font-bold text-primary">1</span>
            <span className="text-muted-foreground">Upload →</span>
            <span className="text-2xl font-bold text-primary">∞</span>
            <span className="text-muted-foreground">Download</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;