import { Camera, Film, Award, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import ringImage from "@/assets/images/giftering.jpg";

const features = [
  {
    icon: Camera,
    title: "Wedding Photography",
    description: "Authentic, candid moments captured with an artistic eye. We document your day as it unfolds naturally.",
  },
  {
    icon: Film,
    title: "Cinematic Films",
    description: "Beautiful wedding films that tell your love story with emotion, music, and stunning cinematography.",
  },
  {
    icon: Award,
    title: "Award-Winning",
    description: "Recognized for our creative vision and dedication to capturing the essence of each unique celebration.",
  },
  {
    icon: Heart,
    title: "Personal Approach",
    description: "We believe in building genuine connections with our couples to capture authentic emotions.",
  },
];

export function AboutSection() {
  const { data: cmsLanding } = useQuery<{
    features?: Array<{ id?: string | number; icon?: string; title?: string; description?: string; is_active?: boolean; display_order?: number }>;
    sections?: { features_title?: string | null; features_subtitle?: string | null };
  }>({
    queryKey: ["/api/cms/landing/public"],
  });

  const cmsFeatures = (cmsLanding?.features || [])
    .filter((feature) => feature.is_active !== false)
    .sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0))
    .map((feature, index) => {
      const iconKey = (feature.icon || "").toLowerCase();
      const icon = iconKey.includes("film")
        ? Film
        : iconKey.includes("award")
          ? Award
          : iconKey.includes("heart")
            ? Heart
            : Camera;

      return {
        id: feature.id ?? `cms-${index}`,
        icon,
        title: feature.title || "Feature",
        description: feature.description || "",
      };
    });

  const displayFeatures = cmsFeatures.length > 0 ? cmsFeatures : features;
  const title = cmsLanding?.sections?.features_title || "Capturing Love, Creating Memories";
  const subtitle = cmsLanding?.sections?.features_subtitle ||
    "We are a team of passionate storytellers dedicated to documenting life's most precious moments. With years of experience and a genuine love for what we do, we create timeless visual narratives that you'll treasure forever.";

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light mb-6">
            {title}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayFeatures.map((feature, index) => {
            const featureKey = "id" in feature ? String(feature.id) : String(index);

            return (
            <Card
              key={featureKey}
              className="p-6 bg-background border-border text-center group hover-elevate"
              data-testid={`card-feature-${index}`}
            >
              <div className="w-12 h-12 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center group-hover:scale-105 transition-transform">
                <feature.icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AboutPageContent() {
  return (
    <div className="space-y-20 py-20 md:py-28">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-light mb-6">
              About Us
            </h1>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Welcome to Norwed Film, where we specialize in capturing the magic of 
                your wedding day through stunning photography and cinematic videography.
              </p>
              <p>
                Based in Oslo, Norway, we travel throughout Scandinavia and beyond to 
                document love stories in the most beautiful locations. Our approach 
                combines artistic vision with authentic storytelling, ensuring every 
                image and frame reflects the genuine emotions of your celebration.
              </p>
              <p>
                With years of experience and a passion for our craft, we understand 
                that your wedding day is one of the most important moments of your life. 
                We're honored to be entrusted with preserving these memories for 
                generations to come.
              </p>
            </div>
          </div>
          <div className="aspect-[4/5] rounded-md overflow-hidden bg-muted">
            <img
              src={ringImage}
              alt="Detaljbilde av gifteringer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <AboutSection />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
          Our Philosophy
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          We believe that the best wedding photos and films come from genuine 
          connections. We take the time to understand your story, your style, 
          and your vision. Our unobtrusive approach allows us to capture candid, 
          authentic moments while you simply enjoy your day.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div>
            <div className="text-4xl font-serif font-light mb-2">200+</div>
            <p className="text-sm text-muted-foreground">Weddings Captured</p>
          </div>
          <div>
            <div className="text-4xl font-serif font-light mb-2">8+</div>
            <p className="text-sm text-muted-foreground">Years Experience</p>
          </div>
          <div>
            <div className="text-4xl font-serif font-light mb-2">15+</div>
            <p className="text-sm text-muted-foreground">Countries</p>
          </div>
        </div>
      </section>
    </div>
  );
}
