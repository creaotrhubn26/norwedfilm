import { Link } from "wouter";
import { Instagram, Mail, Phone } from "lucide-react";
import evendiLogo from "@/assets/images/Evendi_logo_norsk_tagline.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
              <img src="/norwed.png" alt="Norwed Film" className="w-[200px] h-auto brightness-0" />
            <p className="mt-4 text-muted-foreground text-sm max-w-md">
              Capturing love stories with elegance and artistry. Wedding photography 
              and videography in Norway and destinations worldwide.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://instagram.com/norwedfilm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Følg Norwed Film på Instagram"
                title="Instagram"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@norwedfilm.no"
                aria-label="Send e-post til Norwed Film"
                title="Send e-post"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="tel:+4797959294"
                aria-label="Ring Norwed Film"
                title="Ring oss"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-phone"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm tracking-wide uppercase mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-muted-foreground hover:text-foreground text-sm cursor-pointer transition-colors" data-testid="footer-link-home">
                    Home
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <span className="text-muted-foreground hover:text-foreground text-sm cursor-pointer transition-colors" data-testid="footer-link-about">
                    About
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/portfolio/wedding-photo">
                  <span className="text-muted-foreground hover:text-foreground text-sm cursor-pointer transition-colors" data-testid="footer-link-photo">
                    Wedding Photo
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/portfolio/wedding-video">
                  <span className="text-muted-foreground hover:text-foreground text-sm cursor-pointer transition-colors" data-testid="footer-link-video">
                    Wedding Video
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/evendi">
                  <span className="text-muted-foreground hover:text-foreground text-sm cursor-pointer transition-colors" data-testid="footer-link-evendi">
                    <img src={evendiLogo} alt="Evendi" className="h-5 w-auto" />
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm tracking-wide uppercase mb-4">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Oslo, Norway</li>
              <li>contact@norwedfilm.no</li>
              <li>+47 979 59 294</li>
            </ul>
            <Link href="/contact">
              <span className="inline-block mt-4 text-sm font-medium text-foreground hover:underline cursor-pointer" data-testid="footer-link-contact">
                Get in Touch
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Norwed Film. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/admin">
              <span className="hover:text-foreground cursor-pointer transition-colors" data-testid="footer-link-admin">
                Admin
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
