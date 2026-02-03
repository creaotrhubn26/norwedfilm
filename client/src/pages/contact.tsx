import { PublicLayout } from "@/components/public/layout";
import { ContactForm } from "@/components/public/contact-form";

export default function ContactPage() {
  return (
    <PublicLayout>
      <div className="pt-20">
        <ContactForm />
      </div>
    </PublicLayout>
  );
}
