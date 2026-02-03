import { PublicLayout } from "@/components/public/layout";
import { AboutPageContent } from "@/components/public/about-section";

export default function AboutPage() {
  return (
    <PublicLayout>
      <div className="pt-20">
        <AboutPageContent />
      </div>
    </PublicLayout>
  );
}
