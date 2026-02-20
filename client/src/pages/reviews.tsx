import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public/layout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Quote } from "lucide-react";
import type { Review } from "@shared/schema";
import { useSeo } from "@/hooks/use-seo";

export default function ReviewsPage() {
  useSeo({
    title: "Anmeldelser | Norwed Film bryllupsfoto i Norge",
    description:
      "Les ekte anmeldelser fra par som har valgt Norwed Film til bryllupsfoto og bryllupsvideo i Oslo og Norge.",
    canonicalPath: "/reviews",
  });

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
  });

  return (
    <PublicLayout>
      <div className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">
              Kundeanmeldelser
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ekte historier fra par som valgte oss til å dokumentere den store dagen.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews?.map((review) => (
                <Card
                  key={review.id}
                  className="p-6 md:p-8 bg-card border-border"
                  data-testid={`card-review-${review.id}`}
                >
                  <Quote className="w-8 h-8 text-muted-foreground/30 mb-4" />
                  
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: review.rating || 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  <p className="text-foreground/90 mb-6 leading-relaxed">
                    "{review.content}"
                  </p>

                  <div className="border-t border-border pt-4">
                    <p className="font-medium text-foreground">{review.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {review.eventType} · {review.eventDate}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
