import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Calendar, Play } from "lucide-react";
import type { Project, Media } from "@shared/schema";
import { useSeo } from "@/hooks/use-seo";

export default function ProjectPage() {
  const params = useParams<{ slug: string }>();
  
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${params.slug}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
  });

  const { data: media } = useQuery<Media[]>({
    queryKey: ["/api/projects", params.slug, "media"],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${params.slug}/media`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch media");
      return res.json();
    },
    enabled: !!project,
  });

  useSeo({
    title: project?.title
      ? `${project.title} | Bryllupsfoto i Norge | Norwed Film`
      : "Bryllupsprosjekt | Norwed Film",
    description: project?.description
      ? project.description
      : "Se et bryllupsprosjekt fra Norwed Film med bilder og video fra bryllup i Norge.",
    canonicalPath: params?.slug ? `/project/${params.slug}` : "/",
    ogType: "article",
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="pt-28 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-12 w-96 mb-8" />
            <Skeleton className="aspect-video w-full rounded-md" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!project) {
    return (
      <PublicLayout>
        <div className="pt-28 pb-20 text-center">
          <h1 className="font-serif text-3xl mb-4">Prosjektet ble ikke funnet</h1>
          <Link href="/">
            <Button variant="outline">Tilbake til forsiden</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={project.category === "wedding-video" ? "/portfolio/wedding-video" : "/portfolio/wedding-photo"}>
            <Button variant="ghost" className="mb-6 -ml-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake til portefølje
            </Button>
          </Link>

          <div className="max-w-4xl">
            <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">
              {project.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
              {project.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {project.location}
                </span>
              )}
              {project.date && (
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {project.date}
                </span>
              )}
            </div>

            {project.description && (
              <p className="text-muted-foreground leading-relaxed mb-12">
                {project.description}
              </p>
            )}
          </div>

          {project.videoUrl && (
            <div className="aspect-video mb-12 rounded-md overflow-hidden bg-black relative">
              <iframe
                src={project.videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {project.coverImage && !project.videoUrl && (
            <div className="aspect-video mb-12 rounded-md overflow-hidden">
              <img
                src={project.coverImage}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {media && media.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="aspect-[4/3] rounded-md overflow-hidden bg-muted"
                  data-testid={`media-${item.id}`}
                >
                  {item.type === "video" ? (
                    <div className="relative w-full h-full">
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.alt || project.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-12 h-12 text-white fill-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.alt || project.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
