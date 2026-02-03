import { Navigation } from "./navigation";
import { Footer } from "./footer";

interface PublicLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
}

export function PublicLayout({ 
  children, 
  showNavigation = true, 
  showFooter = true 
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {showNavigation && <Navigation />}
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
