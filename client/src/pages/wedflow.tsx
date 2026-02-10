import { PublicLayout } from "@/components/public/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Heart,
  Target,
  Zap,
  CheckCircle,
  Users,
  Calendar,
  MessageSquare,
  Camera,
  CreditCard,
  ClipboardList,
  Utensils,
  ArrowRight,
  Smartphone,
  Film,
  AlertCircle,
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Planning & Timeline",
    description:
      "Build your wedding timeline step by step. Never miss a deadline with smart reminders and task management.",
  },
  {
    icon: CreditCard,
    title: "Budget Management",
    description:
      "Track every expense, set category budgets, and stay in control of your wedding finances with real-time overview.",
  },
  {
    icon: Users,
    title: "Guest Management",
    description:
      "RSVP tracking, dietary preferences, seating assignments, and guest communication — all in one place.",
  },
  {
    icon: Utensils,
    title: "Seating Charts",
    description:
      "Interactive table planner with drag-and-drop seating. See guest relationships and dietary needs at a glance.",
  },
  {
    icon: Calendar,
    title: "Day-of Timeline",
    description:
      "Minute-by-minute schedule for your wedding day. Share with your coordinator and vendors instantly.",
  },
  {
    icon: Camera,
    title: "Photo Plan",
    description:
      "Create your must-have shot list, organize group photos, and share the plan with your photographer.",
  },
  {
    icon: MessageSquare,
    title: "Vendor Messaging",
    description:
      "Direct chat with your vendors in-app. Keep all wedding communication organized and accessible.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description:
      "Designed for your phone. Plan your wedding anywhere — on the couch, at lunch, or on the go.",
  },
];

export default function WedflowPage() {
  return (
    <PublicLayout>
      <div className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20 md:mb-28">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-sm font-medium text-foreground mb-6">
            <Heart className="w-4 h-4" />
            Built by Norwedfilm
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            Meet Wedflow
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-8">
            The complete wedding platform — where couples plan their dream
            wedding and vendors reach the right couples. Born from 200+
            weddings and 8+ years behind the lens at Norwedfilm.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="min-w-[200px]" data-testid="button-wedflow-contact">
                Get Early Access
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#vision">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px]"
                data-testid="button-wedflow-vision"
              >
                Our Vision
              </Button>
            </a>
          </div>
        </section>

        {/* The Golden Circle — Vision */}
        <section
          id="vision"
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-28"
        >
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-foreground" />
              <h2 className="font-serif text-3xl md:text-4xl font-light">
                The Wedflow Vision
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Inspired by Simon Sinek's Golden Circle — we start with WHY.
            </p>
          </div>

          <div className="space-y-6">
            {/* WHY */}
            <Card className="p-6 md:p-8 border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-400 text-white font-bold text-sm">
                  WHY
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-light text-amber-700 dark:text-amber-400">
                  Why we exist
                </h3>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                We believe wedding planning should be one of the most magical
                experiences in life — not a source of stress and chaos. Every
                couple deserves to enjoy the journey to their big day, and
                every vendor deserves to work with engaged couples who value
                their craft.
              </p>
            </Card>

            {/* HOW */}
            <Card className="p-6 md:p-8 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  HOW
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-light text-primary">
                  How we do it
                </h3>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                We connect couples with the best vendors through smart
                technology, seamless communication and tools that simplify
                everything — from budget management and guest handling to
                timeline, seating charts and deliveries. All gathered in one
                place, accessible from your phone.
              </p>
            </Card>

            {/* WHAT */}
            <Card className="p-6 md:p-8 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-sm">
                  WHAT
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-light text-emerald-600 dark:text-emerald-400">
                  What we offer
                </h3>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                Wedflow is a complete wedding platform — an app where couples
                plan their wedding with powerful tools (planning, budget,
                guests, seating charts, timeline, photo plan, messaging),
                while vendors reach the right couples through a marketplace
                with profiles, offers, products and direct chat. All in one
                app.
              </p>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-muted-foreground italic text-sm">
              "People don't buy WHAT you do, they buy WHY you do it." — Simon
              Sinek
            </p>
          </div>
        </section>

        {/* The Norwedfilm Story */}
        <section className="bg-card py-20 md:py-28 mb-20 md:mb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4">
                <Film className="w-6 h-6 text-foreground" />
                <h2 className="font-serif text-3xl md:text-4xl font-light">
                  The Story Behind Wedflow
                </h2>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                "Love stories elegantly told" — Norwedfilm
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Who */}
              <Card className="p-6 bg-background border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-medium">Who is Norwedfilm?</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Norwedfilm is a wedding photography & videography studio
                  based in Oslo, with 200+ weddings documented over 8+ years.
                  We specialize in timeless wedding photography and cinematic
                  wedding films — capturing authentic moments with an artistic
                  eye and telling love stories with emotion and elegance.
                </p>
                <div className="flex items-center gap-8 mt-6 pt-4 border-t border-border">
                  <div>
                    <div className="text-2xl font-serif font-light">200+</div>
                    <p className="text-xs text-muted-foreground">Weddings</p>
                  </div>
                  <div>
                    <div className="text-2xl font-serif font-light">8+</div>
                    <p className="text-xs text-muted-foreground">
                      Years Experience
                    </p>
                  </div>
                </div>
              </Card>

              {/* Problem */}
              <Card className="p-6 bg-background border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-medium">The Problem We Saw</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  After being present at hundreds of weddings, we saw the same
                  pattern over and over: stressed couples juggling messages,
                  spreadsheets and different apps for budget, guests and
                  timeline. Vendors struggled to reach the right couples and
                  manage bookings efficiently. There simply wasn't a single
                  platform solving everything — especially not tailored for
                  the Scandinavian market.
                </p>
              </Card>

              {/* Philosophy */}
              <Card className="p-6 bg-background border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-medium">Our Philosophy</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We believe the best wedding experiences come from genuine
                  connections. We take the time to understand each couple's
                  story, style, and vision — and our unobtrusive approach lets
                  us capture authentic, candid moments while couples simply
                  enjoy their day. The same philosophy drives Wedflow.
                </p>
              </Card>

              {/* Solution */}
              <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-medium text-emerald-700 dark:text-emerald-400">
                    The Solution: Wedflow
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  That's why we built Wedflow — the app we wished existed
                  ourselves. A complete wedding platform where couples plan
                  their wedding with powerful tools, and vendors reach the
                  right couples through a marketplace with direct
                  communication. All in one app, designed with love for
                  Scandinavian weddings.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools for couples and vendors — designed to make
              wedding planning joyful, not stressful.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 bg-background border-border text-center group hover:shadow-md transition-shadow"
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
            ))}
          </div>
        </section>

        {/* For Vendors */}
        <section className="bg-card py-20 md:py-28 mb-20 md:mb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
                  For Wedding Vendors
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Reach couples who are actively planning their wedding.
                  Showcase your work, manage bookings, and communicate
                  directly — all through one platform designed for the
                  wedding industry.
                </p>
                <ul className="space-y-4">
                  {[
                    "Create your vendor profile with portfolio & pricing",
                    "Receive and manage booking inquiries",
                    "Direct messaging with couples",
                    "Showcase products, packages & offers",
                    "Build reviews and social proof",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground/90">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="aspect-square rounded-md overflow-hidden bg-muted">
                <div className="w-full h-full bg-gradient-to-br from-accent to-muted flex items-center justify-center">
                  <span className="font-serif text-4xl text-muted-foreground/30">
                    Vendor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
            Ready to Transform Your Wedding Planning?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Whether you're a couple starting your wedding journey or a vendor
            looking for the right couples — Wedflow brings everyone together
            on one beautiful platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="min-w-[200px]" data-testid="button-wedflow-cta">
                Contact Us
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px]"
                data-testid="button-wedflow-about"
              >
                About Norwedfilm
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
