import { Button } from "@/components/ui/button";
import { Users, Heart, Star } from "lucide-react";
import womanEntrepreneur from "@/assets/woman-entrepreneur.jpg";
import manEntrepreneur from "@/assets/man-entrepreneur.jpg";

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Loved by creators
            <span className="bg-gradient-primary bg-clip-text text-transparent"> worldwide</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From solo entrepreneurs to global brands, everyone's boosting their sales with VibeBoost.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Women Testimonial */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl text-foreground font-medium leading-relaxed">
              "I went from spending hours editing photos to getting professional results in seconds. My jewelry sales increased 300% after using VibeBoost!"
            </blockquote>
            <div className="flex items-center gap-4">
              <img 
                src={womanEntrepreneur} 
                alt="Sarah Chen, jewelry entrepreneur using VibeBoost for product photography" 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-foreground">Sarah Chen</div>
                <div className="text-sm text-muted-foreground">Jewelry Designer</div>
              </div>
            </div>
          </div>

          {/* Men Testimonial */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl text-foreground font-medium leading-relaxed">
              "As a tech startup founder, I needed product shots that looked expensive without the budget. VibeBoost delivered exactly that."
            </blockquote>
            <div className="flex items-center gap-4">
              <img 
                src={manEntrepreneur} 
                alt="Marcus Rodriguez, tech entrepreneur using VibeBoost for product marketing" 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-foreground">Marcus Rodriguez</div>
                <div className="text-sm text-muted-foreground">Tech Entrepreneur</div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Users className="h-6 w-6" />
              <span className="text-3xl font-bold">50,000+</span>
            </div>
            <div className="text-muted-foreground">Active Users</div>
            <div className="text-sm text-muted-foreground">Growing daily</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Heart className="h-6 w-6 fill-current" />
              <span className="text-3xl font-bold">4.9/5</span>
            </div>
            <div className="text-muted-foreground">Average Rating</div>
            <div className="text-sm text-muted-foreground">From 12k+ reviews</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Star className="h-6 w-6 fill-current" />
              <span className="text-3xl font-bold">2M+</span>
            </div>
            <div className="text-muted-foreground">Photos Enhanced</div>
            <div className="text-sm text-muted-foreground">This month alone</div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;