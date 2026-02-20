import { PublicLayout } from "@/components/public/layout";
import { AboutPageContent } from "@/components/public/about-section";
import { useSeo } from "@/hooks/use-seo";

export default function AboutPage() {
  useSeo({
    title: "Om Norwed Film | Bryllupsfoto og bryllupsvideo i Norge",
    description:
      "Les mer om Norwed Film, vår stil og hvordan vi jobber med bryllupsfoto og bryllupsvideo for par i Oslo og resten av Norge.",
    canonicalPath: "/about",
  });

  return (
    <PublicLayout>
      <div className="pt-20">
        <AboutPageContent />
      </div>
    </PublicLayout>
  );
}
