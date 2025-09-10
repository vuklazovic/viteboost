import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for trying out VibeBoost",
    features: [
      "5 images per month",
      "Basic AI enhancement",
      "Standard quality output",
      "Email support"
    ],
    cta: "Get Started",
    variant: "outline" as const
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For creators and small businesses",
    features: [
      "500 images per month",
      "Advanced AI enhancement",
      "HD quality output",
      "Multiple style variants",
      "Priority support",
      "Commercial license"
    ],
    cta: "Start Free Trial",
    variant: "hero" as const,
    popular: true
  },
  {
    name: "Business",
    price: "$99",
    period: "per month",
    description: "For agencies and large teams",
    features: [
      "2,500 images per month",
      "Enterprise AI models",
      "4K quality output",
      "Custom brand templates",
      "Team collaboration",
      "24/7 phone support",
      "API access"
    ],
    cta: "Contact Sales",
    variant: "premium" as const
  }
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Simple, transparent
            <span className="bg-gradient-primary bg-clip-text text-transparent"> pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 ${
                plan.popular ? 'ring-2 ring-primary/20 shadow-medium scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button variant={plan.variant} size="lg" className="w-full">
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-16 space-y-4">
          <p className="text-muted-foreground">
            All plans include our core AI enhancement technology
          </p>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <span>✓ No setup fees</span>
            <span>✓ Cancel anytime</span>
            <span>✓ 14-day free trial</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;