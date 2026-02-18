import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Review } from "@shared/schema";

const defaultReviews: Partial<Review>[] = [
  {
    id: "1",
    name: "Emma & Lars Andersen",
    eventType: "Wedding",
    eventDate: "June 2024",
    rating: 5,
    content: "Norwed Film captured our wedding day perfectly. Every photo and every frame of video brings us back to those magical moments. Their professionalism and artistic vision exceeded all our expectations.",
    featured: true,
  },
  {
    id: "2",
    name: "Sofia & Henrik Berg",
    eventType: "Wedding",
    eventDate: "August 2024",
    rating: 5,
    content: "We couldn't be happier with our wedding film. The team was so professional and made us feel completely at ease. The final result is absolutely stunning - we've watched it countless times!",
    featured: true,
  },
  {
    id: "3",
    name: "Maria & Johan Nilsen",
    eventType: "Wedding",
    eventDate: "September 2024",
    rating: 5,
    content: "From the first meeting to receiving our final gallery, the experience was incredible. They captured not just images, but the emotions and atmosphere of our special day.",
    featured: true,
  },
];

interface ReviewsProps {
  reviews?: Partial<Review>[];
  featured?: boolean;
  title?: string;
  subtitle?: string;
}

export function ReviewsSection({
  reviews = defaultReviews,
  featured = true,
  title = "What Our Couples Say",
  subtitle = "We're honored to be part of so many beautiful love stories. Here's what our couples have to say about their experience.",
}: ReviewsProps) {
  const displayReviews = featured 
    ? reviews.filter(r => r.featured).slice(0, 3)
    : reviews;

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayReviews.map((review) => (
            <Card
              key={review.id}
              className="p-6 md:p-8 bg-background border-border"
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
      </div>
    </section>
  );
}
