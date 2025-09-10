import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Twitter, Linkedin, Github, Mail } from "lucide-react";

const Footer = () => {
  const legalPages = [
    "Terms & Conditions",
    "Privacy Policy", 
    "Refund Policy"
  ];

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4">
        {/* CTA Section */}
        <div className="py-16 text-center border-b border-background/10">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Product Images?
          </h2>
          <p className="text-xl text-background/80 max-w-2xl mx-auto mb-8">
            Join thousands of businesses already using VibeBoost to create stunning product visuals.
          </p>
          <Button size="lg" variant="secondary" className="gap-2">
            <Sparkles className="h-5 w-5" />
            Start Your Free Trial
          </Button>
        </div>

        {/* Links Section */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold">VibeBoost</span>
              </div>
              <p className="text-background/80 mb-6 max-w-sm">
                AI-powered product image transformation for modern businesses. 
                Create professional marketing visuals in seconds.
              </p>
              <div className="flex items-center gap-4">
                <Twitter className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
                <Linkedin className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
                <Github className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
                <Mail className="h-5 w-5 text-background/60 hover:text-background cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Legal Links */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="flex items-center gap-8">
                {legalPages.map((page) => (
                  <a 
                    key={page}
                    href="#" 
                    className="text-background/80 hover:text-background transition-colors text-sm"
                  >
                    {page}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-background/10" />

        {/* Bottom Section */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-background/80 text-sm">
            © 2024 VibeBoost. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-background/80">
            <span>Made with ❤️ for creators worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;