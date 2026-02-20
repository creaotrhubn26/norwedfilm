import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/layout";
import { PortfolioGrid } from "@/components/public/portfolio-grid";
import type { Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeo } from "@/hooks/use-seo";

export default function PortfolioPage() {
  const params = useParams<{ category: string }>();
  const category = params.category;
  
  const categoryTitle = category === "wedding-photo" 
    ? "Bryllupsfotografering" 
    : category === "wedding-video"
      ? "Bryllupsvideo"
      : "Portefølje";

  const categoryDescription = category === "wedding-photo"
    ? "Tidløse bryllupsbilder som fanger alle de viktige øyeblikkene"
    : category === "wedding-video"
      ? "Cinematiske bryllupsfilmer som forteller kjærlighetshistorien deres"
      : "Vår komplette portefølje med bryllupsfoto og bryllupsvideo";

  useSeo({
    title:
      category === "wedding-photo"
        ? "Bryllupsfoto portefølje | Norwed Film"
        : category === "wedding-video"
          ? "Bryllupsvideo portefølje | Norwed Film"
          : "Portefølje | Norwed Film",
    description:
      category === "wedding-photo"
        ? "Se vår portefølje med bryllupsfoto fra Oslo og resten av Norge."
        : category === "wedding-video"
          ? "Se vår portefølje med bryllupsvideo fra Oslo og hele Norge."
          : "Utforsk bryllupsfoto og bryllupsvideo fra Norwed Film i Norge.",
    canonicalPath: category ? `/portfolio/${category}` : "/portfolio",
  });

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { category }],
    queryFn: async () => {
      const url = category ? `/api/projects?category=${category}` : "/api/projects";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  return (
    <PublicLayout>
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">
              {categoryTitle}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {categoryDescription}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-md" />
              ))}
            </div>
          ) : (
            <PortfolioGrid 
              projects={projects} 
              category={category}
              showAll 
            />
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
