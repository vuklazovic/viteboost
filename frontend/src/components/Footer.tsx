import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const handleSectionNavigation = (sectionId: string) => {
    if (window.location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">VibeBoost</span>
            </div>
            <p className="text-background/70 leading-relaxed">
              Transform your product images with AI-powered enhancement.
              Professional results in seconds.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-background/70">
              <li>
                <button
                  onClick={() => handleSectionNavigation('features')}
                  className="hover:text-background transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSectionNavigation('pricing')}
                  className="hover:text-background transition-colors"
                >
                  Pricing
                </button>
              </li>
              <li>
                <Link to="/generate" className="hover:text-background transition-colors">
                  Generate
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-background/70">
              <li>
                <Link to="/privacy" className="hover:text-background transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-background transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refund" className="hover:text-background transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-background/70">
              <li>
                <a href="mailto:support@vibeboost.com" className="hover:text-background transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <Link to="/subscription" className="hover:text-background transition-colors">
                  Manage Subscription
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 text-center text-background/70">
          <p>&copy; 2024 VibeBoost. All rights reserved. Made with ❤️ for creators worldwide.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;