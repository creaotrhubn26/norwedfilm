import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  {
    label: "Portfolio",
    children: [
      { href: "/portfolio/wedding-photo", label: "Wedding Photo" },
      { href: "/portfolio/wedding-video", label: "Wedding Video" },
    ],
  },
  { href: "/reviews", label: "Reviews" },
  { href: "/evendi", label: "Evendi" },
  { href: "/contact", label: "Contact" },
];

export function Navigation() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => location === href;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/">
            <span
              className={cn(
                "font-serif text-xl md:text-2xl font-semibold tracking-wide cursor-pointer transition-colors",
                isScrolled ? "text-foreground" : "text-white"
              )}
              data-testid="link-logo"
            >
              NORWED FILM
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <DropdownMenu key={link.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "font-medium text-sm tracking-wide gap-1",
                        isScrolled
                          ? "text-foreground hover:bg-accent"
                          : "text-white/90 hover:text-white hover:bg-white/10"
                      )}
                      data-testid="button-portfolio-dropdown"
                    >
                      {link.label}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {link.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link href={child.href}>
                          <span
                            className={cn(
                              "w-full cursor-pointer",
                              isActive(child.href) && "font-semibold"
                            )}
                            data-testid={`link-${child.label.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {child.label}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link key={link.href} href={link.href}>
                  <span
                    className={cn(
                      "px-4 py-2 font-medium text-sm tracking-wide cursor-pointer transition-colors rounded-md",
                      isScrolled
                        ? isActive(link.href)
                          ? "text-foreground bg-accent"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        : isActive(link.href)
                          ? "text-white bg-white/20"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                    data-testid={`link-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </span>
                </Link>
              )
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "md:hidden",
              isScrolled ? "text-foreground" : "text-white"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="space-y-1">
                  <span className="block px-3 py-2 text-sm font-medium text-muted-foreground">
                    {link.label}
                  </span>
                  {link.children.map((child) => (
                    <Link key={child.href} href={child.href}>
                      <span
                        className={cn(
                          "block px-6 py-2 text-sm cursor-pointer rounded-md transition-colors",
                          isActive(child.href)
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                        data-testid={`mobile-link-${child.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {child.label}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <Link key={link.href} href={link.href}>
                  <span
                    className={cn(
                      "block px-3 py-2 text-sm cursor-pointer rounded-md transition-colors",
                      isActive(link.href)
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid={`mobile-link-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </span>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
