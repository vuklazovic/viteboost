import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface PricingSectionProps {
  onTryNow?: () => void;
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    period: "forever",
    description: "Perfect for trying out VibeBoost",
    features: [
      "15 credits per month",
      "Basic image generation",
      "Standard processing speed",
      "Email support"
    ],
    cta: "Get Started",
    variant: "outline" as const
  },
  {
    id: "basic",
    name: "Basic",
    price: "$12",
    period: "per month",
    description: "Great for individuals",
    features: [
      "100 credits per month",
      "Priority processing",
      "Email support",
      "HD image generation"
    ],
    cta: "Subscribe",
    variant: "outline" as const
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39",
    period: "per month",
    description: "For creators and small businesses",
    features: [
      "500 credits per month",
      "Fast processing",
      "Priority support",
      "Advanced features",
      "HD image generation"
    ],
    cta: "Subscribe",
    variant: "hero" as const,
    popular: true
  },
  {
    id: "business",
    name: "Business",
    price: "$89",
    period: "per month",
    description: "For agencies and large teams",
    features: [
      "1500 credits per month",
      "Fastest processing",
      "Premium support",
      "All advanced features",
      "HD image generation",
      "API access"
    ],
    cta: "Subscribe",
    variant: "outline" as const
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "Custom solutions for large organizations",
    features: [
      "Custom credit allocation",
      "Dedicated infrastructure",
      "24/7 priority support",
      "Custom integrations",
      "Advanced analytics",
      "SLA guarantee",
      "Dedicated account manager"
    ],
    cta: "Contact Sales",
    variant: "premium" as const,
    enterprise: true
  }
];

const PricingSection = ({ onTryNow }: PricingSectionProps) => {
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();

  const handlePlanSelect = async (planId: string) => {
    if (planId === "free") {
      if (!isAuthenticated) {
        navigate("/auth");
        return;
      }
      toast.info("You're already on the free plan! Sign in to get started.");
      return;
    }

    if (planId === "enterprise") {
      toast.info("Enterprise plans require custom setup. Please contact our sales team.");
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    // Create checkout session with user metadata
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

      if (!session?.access_token) {
        toast.error("Please sign in to continue");
        navigate("/auth");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ plan_id: planId })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkout_url;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.detail || "Failed to create checkout session");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to process payment");
    }
  };

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
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 ${
                plan.popular ? 'ring-2 ring-primary/20 shadow-medium scale-105' : ''
              } ${
                plan.enterprise ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50' : ''
              }`}
            >
              {plan.popular && !plan.enterprise && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}
              {plan.enterprise && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    Need More?
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
                
                <Button
                  variant={plan.variant}
                  size="lg"
                  className={`w-full ${
                    plan.enterprise ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
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