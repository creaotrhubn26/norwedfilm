import { ExternalLink } from "lucide-react";

type Partner = {
  id?: string | number;
  name?: string;
  logo_url?: string;
  website_url?: string;
  is_active?: boolean;
  display_order?: number;
};

interface PartnersSectionProps {
  title?: string;
  subtitle?: string;
  partners?: Partner[];
}

export function PartnersSection({
  title = "Trusted by Partners",
  subtitle = "Brands and venues we love working with.",
  partners = [],
}: PartnersSectionProps) {
  const visiblePartners = partners
    .filter((partner) => partner.is_active !== false)
    .sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0));

  if (visiblePartners.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 bg-card border-y border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl md:text-3xl font-light mb-3">{title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {visiblePartners.map((partner, index) => {
            const key = String(partner.id ?? `partner-${index}`);
            const content = (
              <div className="h-20 rounded-md border border-border bg-background flex items-center justify-center px-4 hover:bg-accent/40 transition-colors">
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={partner.name || "Partner"}
                    className="max-h-10 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground text-center">
                    {partner.name || "Partner"}
                  </span>
                )}
              </div>
            );

            if (partner.website_url) {
              return (
                <a
                  key={key}
                  href={partner.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative"
                >
                  {content}
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            }

            return <div key={key}>{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
