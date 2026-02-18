import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";
import { Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PortfolioGridProps {
  projects?: Partial<Project>[];
  category?: string;
  showAll?: boolean;
}

export function PortfolioGrid({ 
  projects, 
  category,
  showAll = false 
}: PortfolioGridProps) {
  const filteredProjects = category 
    ? projects?.filter(p => p.category === category)
    : projects;

  const displayProjects = showAll ? filteredProjects : filteredProjects?.slice(0, 6);

  if (!displayProjects || displayProjects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No projects found in this category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayProjects.map((project) => (
        <Link key={project.id} href={`/project/${project.slug}`}>
          <div
            className="group relative aspect-[4/5] overflow-hidden rounded-md cursor-pointer"
            data-testid={`card-project-${project.id}`}
          >
            <img
              src={project.coverImage || "https://images.unsplash.com/photo-1519741497674-611481863552?w=600"}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
            
            {project.category?.includes("video") && (
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h3 className="font-serif text-xl md:text-2xl font-medium mb-1 group-hover:translate-y-0 translate-y-2 transition-transform duration-300">
                {project.title}
              </h3>
              <p className="text-sm text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                {project.location} · {project.date}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function PortfolioSection() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light mb-4">
            Our Portfolio
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every love story is unique. We capture the emotions, the beauty, and timeless moments that make your day unforgettable.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          <Link href="/portfolio/wedding-photo">
            <span
              className="px-6 py-2 text-sm font-medium tracking-wide border border-border rounded-md hover:bg-accent transition-colors cursor-pointer"
              data-testid="link-portfolio-photo"
            >
              Wedding Photo
            </span>
          </Link>
          <Link href="/portfolio/wedding-video">
            <span
              className="px-6 py-2 text-sm font-medium tracking-wide border border-border rounded-md hover:bg-accent transition-colors cursor-pointer"
              data-testid="link-portfolio-video"
            >
              Wedding Video
            </span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-md" />
            ))}
          </div>
        ) : (
          <PortfolioGrid projects={projects} />
        )}
      </div>
    </section>
  );
}
