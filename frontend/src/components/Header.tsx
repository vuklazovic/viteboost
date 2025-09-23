import { Button } from "@/components/ui/button";
import { Zap, LogOut, User, Loader2, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthModal } from "@/hooks/useAuthModal";
import { AuthModal } from "@/components/auth/AuthModal";

const Header = () => {
  const { user, logout, isAuthenticated, credits, creditsLoading } = useAuth();
  const authModal = useAuthModal();
  const navigate = useNavigate();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const handleGenerateClick = () => {
    if (isAuthenticated) {
      navigate('/generate');
    } else {
      authModal.openLogin();
    }
  };

  const handleSectionNavigation = (sectionId: string) => {
    if (window.location.pathname === '/') {
      // If on home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on another page, navigate to home and scroll to section
      navigate('/', { replace: false });
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">VibeBoost</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={handleGenerateClick}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Generate
          </button>
          <button
            onClick={() => handleSectionNavigation('features')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => handleSectionNavigation('pricing')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={() => handleSectionNavigation('examples')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Examples
          </button>
        </nav>
        
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <>
              {/* Compact credits for mobile */}
              <div
                className="flex sm:hidden items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-foreground"
                title="Your available credits"
              >
                {creditsLoading ? (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                ) : (
                  <Zap className="h-3 w-3 text-primary" />
                )}
                <span>{creditsLoading ? '…' : credits}</span>
              </div>

              {/* Full credits pill for >= sm */}
              <div
                className="hidden sm:flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-foreground"
                title="Your available credits"
              >
                {creditsLoading ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 text-primary" />
                )}
                <span>{creditsLoading ? '...' : credits}</span>
                <span className="text-muted-foreground">credits</span>
              </div>
            </>
          )}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.email ? getInitials(user.email) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/subscription')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Manage Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="ghost" 
                className="hidden md:inline-flex"
                onClick={() => authModal.openLogin()}
              >
                Sign In
              </Button>
              <Button 
                variant="hero" 
                size="sm"
                onClick={() => authModal.openLogin()}
              >
                Try Free
              </Button>
            </>
          )}
        </div>
      </div>
      
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.closeModal}
        defaultTab={authModal.defaultTab}
      />
    </header>
  );
};

export default Header;
