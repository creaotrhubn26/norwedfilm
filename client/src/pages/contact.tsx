import { PublicLayout } from "@/components/public/layout";
import { ContactForm } from "@/components/public/contact-form";
import { useSeo } from "@/hooks/use-seo";

export default function ContactPage() {
  useSeo({
    title: "Kontakt Norwed Film | Bryllupsfotograf i Norge",
    description:
      "Kontakt Norwed Film for bryllupsfoto og bryllupsvideo i Oslo og Norge. Fortell oss om dato, lokasjon og planene deres.",
    canonicalPath: "/contact",
  });

  return (
    <PublicLayout>
      <div className="pt-20">
        <ContactForm />
      </div>
    </PublicLayout>
  );
}
