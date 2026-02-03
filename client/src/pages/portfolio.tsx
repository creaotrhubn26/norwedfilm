import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/layout";
import { PortfolioGrid } from "@/components/public/portfolio-grid";
import type { Project } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioPage() {
  const params = useParams<{ category: string }>();
  const category = params.category;
  
  const categoryTitle = category === "wedding-photo" 
    ? "Wedding Photography" 
    : category === "wedding-video"
      ? "Wedding Videography"
      : "Portfolio";

  const categoryDescription = category === "wedding-photo"
    ? "Timeless photographs capturing every precious moment of your special day"
    : category === "wedding-video"
      ? "Cinematic wedding films that tell your love story with emotion and artistry"
      : "Our complete collection of wedding photography and videography";

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
