import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-gradient-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Ready to transform your products?
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Your competitors are already using AI.
              <span className="bg-gradient-primary bg-clip-text text-transparent"> Don't get left behind.</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join 50,000+ sellers who've boosted their sales with professional product photos. 
              Start your free trial today - no photographer, no problem.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="cta" 
              size="lg" 
              className="text-lg px-12 py-6 group"
              onClick={() => {
                const uploadSection = document.querySelector('[data-section="upload"]');
                uploadSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
              Try VibeBoost Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-primary/20 hover:border-primary/40 group">
              <span className="transition-transform group-hover:scale-105">Watch Demo</span>
            </Button>
          </div>
          
          <div className="pt-8 text-sm text-muted-foreground">
            No setup required • Cancel anytime • 14-day free trial
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;