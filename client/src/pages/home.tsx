import { PublicLayout } from "@/components/public/layout";
import { HeroSlideshow } from "@/components/public/hero-slideshow";
import { PortfolioSection } from "@/components/public/portfolio-grid";
import { AboutSection } from "@/components/public/about-section";
import { ReviewsSection } from "@/components/public/reviews-section";
import { ContactForm } from "@/components/public/contact-form";

export default function HomePage() {
  return (
    <PublicLayout>
      <HeroSlideshow />
      <AboutSection />
      <PortfolioSection />
      <ReviewsSection />
      <ContactForm />
    </PublicLayout>
  );
}
