import cosmeticsImage from "@/assets/cosmetics-showcase.jpg";
import fashionImage from "@/assets/fashion-products.jpg";
import techImage from "@/assets/tech-gadgets.jpg";
import beforeAfterImage from "@/assets/before-after-watch.jpg";
import womensJewelry from "@/assets/womens-jewelry.jpg";
import mensAccessories from "@/assets/mens-accessories.jpg";
import unisexLifestyle from "@/assets/unisex-lifestyle.jpg";
import splitGenderProducts from "@/assets/split-gender-products.jpg";

interface ShowcaseSectionProps {
  onTryNow?: () => void;
}

const ShowcaseSection = ({ onTryNow }: ShowcaseSectionProps) => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Before/After Showcase */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            See the
            <span className="bg-gradient-primary bg-clip-text text-transparent"> transformation</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From basic product shots to viral-worthy content. Your products deserve to shine.
          </p>
        </div>

        {/* Before/After Image */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="relative rounded-2xl overflow-hidden shadow-strong">
            <img 
              src={beforeAfterImage} 
              alt="Before and after product transformation showing dramatic improvement in lighting and composition" 
              className="w-full h-auto"
            />
            <div className="absolute top-4 left-4 px-4 py-2 bg-primary/90 text-primary-foreground text-sm font-medium rounded-full">
              AI-Enhanced in 3 seconds
            </div>
          </div>
        </div>

        {/* Product Categories */}
        <div className="space-y-4 mb-12 text-center">
          <h3 className="text-3xl font-bold text-foreground">Perfect for everyone, every product</h3>
          <p className="text-lg text-muted-foreground">Whether you're selling to women, men, or both - VibeBoost creates stunning visuals that convert.</p>
        </div>

        {/* Gender Split Showcase */}
        <div className="max-w-5xl mx-auto mb-16">
          <img 
            src={splitGenderProducts} 
            alt="Product photography for both men and women showing fashion accessories and lifestyle items" 
            className="w-full h-auto rounded-2xl shadow-strong"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 hover:-translate-y-2">
            <img 
              src={womensJewelry} 
              alt="Elegant women's jewelry collection with professional lighting and styling" 
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <h4 className="text-lg font-semibold">Women's Jewelry</h4>
              <p className="text-xs opacity-90">Luxury appeal</p>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 hover:-translate-y-2">
            <img 
              src={mensAccessories} 
              alt="Men's accessories and grooming products with masculine aesthetic" 
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <h4 className="text-lg font-semibold">Men's Accessories</h4>
              <p className="text-xs opacity-90">Premium style</p>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 hover:-translate-y-2">
            <img 
              src={unisexLifestyle} 
              alt="Unisex lifestyle products including sneakers, tech, and modern accessories" 
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <h4 className="text-lg font-semibold">Unisex Lifestyle</h4>
              <p className="text-xs opacity-90">Trendy vibes</p>
            </div>
          </div>
          <div className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 hover:-translate-y-2">
            <img 
              src={techImage} 
              alt="Tech gadgets and electronics with dramatic professional lighting" 
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-3 text-white">
              <h4 className="text-lg font-semibold">Electronics & Tech</h4>
              <p className="text-xs opacity-90">Sleek shots</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border/50">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">10x</div>
            <div className="text-sm text-muted-foreground">More Engagement</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">95%</div>
            <div className="text-sm text-muted-foreground">Time Saved</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">$5K+</div>
            <div className="text-sm text-muted-foreground">Avg. Revenue Boost</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">Instant Results</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;