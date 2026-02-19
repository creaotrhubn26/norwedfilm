import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import type { HeroSlide } from "@shared/schema";
import heroImage from "@/assets/images/Indisk-brudepar-Norge.jpg";

const fallbackSlides = [
  {
    id: "1",
    imageUrl: heroImage,
    title: "Love Stories",
    subtitle: "Elegantly Told",
    ctaText: "Book Us",
    ctaLink: "/contact",
  },
];

export function HeroSlideshow() {
  const { data: apiSlides, isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides"],
  });

  const slides = apiSlides && apiSlides.length > 0 ? apiSlides : fallbackSlides;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [slides]);

  if (isLoading) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
        >
          <img
            src={slide.imageUrl}
            alt={slide.title || "Wedding photography"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
        </div>
      ))}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
        <div className="max-w-4xl">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-wide mb-2">
            {currentSlideData?.title || "Love Stories"}
          </h1>
          <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-light italic tracking-wide opacity-90">
            {currentSlideData?.subtitle || "Elegantly Told"}
          </p>
          <Link href={currentSlideData?.ctaLink || "/contact"}>
            <Button
              size="lg"
              className="mt-8 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 font-medium tracking-wider text-sm px-8"
              data-testid="button-hero-cta"
            >
              {currentSlideData?.ctaText || "BOOK US"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Gå til slide ${index + 1}`}
            title={`Slide ${index + 1}`}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/70"
            )}
            data-testid={`button-slide-${index}`}
          />
        ))}
      </div>

      <div className="absolute bottom-8 right-8 flex items-center gap-2 text-white/80">
        <span className="text-sm font-medium">
          {currentSlide + 1} / {slides.length}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/10"
        onClick={prevSlide}
        data-testid="button-prev-slide"
      >
        <ChevronLeft className="w-8 h-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white hover:bg-white/10"
        onClick={nextSlide}
        data-testid="button-next-slide"
      >
        <ChevronRight className="w-8 h-8" />
      </Button>
    </div>
  );
}
