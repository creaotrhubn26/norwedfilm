import { PublicLayout } from "@/components/public/layout";
import { HeroSlideshow } from "@/components/public/hero-slideshow";
import { PortfolioSection } from "@/components/public/portfolio-grid";
import { AboutSection } from "@/components/public/about-section";
import { ReviewsSection } from "@/components/public/reviews-section";
import { ContactForm } from "@/components/public/contact-form";
import { PartnersSection } from "@/components/public/partners-section";
import { useQuery } from "@tanstack/react-query";
import { useSeo } from "@/hooks/use-seo";

type CmsLandingPublic = {
  testimonials?: Array<{
    id?: string;
    name?: string;
    eventType?: string;
    eventDate?: string;
    rating?: number;
    content?: string;
    featured?: boolean;
  }>;
  partners?: Array<{
    id?: string;
    name?: string;
    logo_url?: string;
    website_url?: string;
    is_active?: boolean;
    display_order?: number;
  }>;
  sections?: {
    testimonials_title?: string | null;
    testimonials_subtitle?: string | null;
    contact_title?: string | null;
    contact_subtitle?: string | null;
    partners_title?: string | null;
    partners_subtitle?: string | null;
  };
  contact?: {
    email?: string | null;
    phone?: string | null;
  };
};

export default function HomePage() {
  useSeo({
    title: "Bryllupsfotograf i Oslo og Norge | Norwed Film",
    description:
      "Norwed Film tilbyr bryllupsfoto og bryllupsvideo i Oslo og hele Norge. Vi dokumenterer dagen deres med tidløse bilder og filmfortelling.",
    canonicalPath: "/",
  });

  const { data: cmsLanding } = useQuery<CmsLandingPublic>({
    queryKey: ["/api/cms/landing/public"],
  });

  return (
    <PublicLayout>
      <HeroSlideshow />
      <AboutSection />
      <PortfolioSection />
      <PartnersSection
        title={cmsLanding?.sections?.partners_title || undefined}
        subtitle={cmsLanding?.sections?.partners_subtitle || undefined}
        partners={cmsLanding?.partners}
      />
      <ReviewsSection
        reviews={cmsLanding?.testimonials}
        title={cmsLanding?.sections?.testimonials_title || undefined}
        subtitle={cmsLanding?.sections?.testimonials_subtitle || undefined}
      />
      <ContactForm
        title={cmsLanding?.sections?.contact_title || undefined}
        subtitle={cmsLanding?.sections?.contact_subtitle || undefined}
        email={cmsLanding?.contact?.email || undefined}
        phone={cmsLanding?.contact?.phone || undefined}
      />
    </PublicLayout>
  );
}
