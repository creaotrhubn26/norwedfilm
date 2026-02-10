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
  Eye,
  ClipboardList,
  Utensils,
  ArrowRight,
  Film,
  AlertCircle,
  Truck,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Photo Plan & Shot List",
    description:
      "The feature only a photographer could build. Organize must-have shots, group portraits, and share your visual plan directly with your photographer.",
  },
  {
    icon: Utensils,
    title: "Interactive Seating Charts",
    description:
      "Drag-and-drop table planner with relationship mapping and dietary needs. Visualize your reception layout the way we visualize a scene.",
  },
  {
    icon: Calendar,
    title: "Day-of Minute Timeline",
    description:
      "A second-by-second wedding-day schedule — built the way a film crew plans a shoot. Share it live with your coordinator and every vendor.",
  },
  {
    icon: Truck,
    title: "Vendor Deliveries",
    description:
      "Track what every vendor is delivering, when it arrives, and who's responsible. No more wondering where the flowers are.",
  },
  {
    icon: ClipboardList,
    title: "Task & Milestone Tracker",
    description:
      "Visual progress through your wedding journey. Milestones, deadlines, and reminders built around real Scandinavian wedding timelines.",
  },
  {
    icon: Eye,
    title: "Couple Profile & Story",
    description:
      "Share your love story, cultural traditions, and style preferences — so every vendor understands your vision before the first meeting.",
  },
  {
    icon: MessageSquare,
    title: "Vendor Conversations",
    description:
      "Threaded messaging with every vendor, organized by wedding. No more lost emails, no more scattered WhatsApp threads.",
  },
  {
    icon: Sparkles,
    title: "Cultural Traditions",
    description:
      "Built-in support for Norwegian and Scandinavian wedding traditions — from brudevals to kransekake. Honour your heritage naturally.",
  },
];

export default function WedflowPage() {
  return (
    <PublicLayout>
      <div className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20 md:mb-28">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-sm font-medium text-foreground mb-6">
            <Film className="w-4 h-4" />
            From the Lens to the Platform
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            Wedflow
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-4">
            The wedding platform built by people who've actually been at 200+
            weddings. Not from a tech office — from behind the camera, in the
            rain, at midnight, cutting the cake.
          </p>
          <p className="text-muted-foreground/80 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Wedflow is born from Norwedfilm's first-hand experience of what
            couples and vendors really need on the ground — not what a
            checklist generator thinks they need.
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
                After filming 200+ weddings we kept seeing the same thing:
                couples drowning in spreadsheets instead of enjoying the
                engagement, vendors missing moments because logistics fell
                apart, and beautiful days undermined by avoidable chaos. We
                exist because we refuse to keep watching that happen — the
                journey to "I do" should feel as extraordinary as the day
                itself.
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
                By channeling everything we've learned behind the lens into
                purpose-built tools: a visual day-of timeline designed like a
                shoot schedule, a photo plan only a photographer would think
                to include, interactive seating charts, vendor delivery
                tracking, and threaded conversations that replace the chaos of
                scattered messages. Every feature exists because we saw the
                need in person — not on a whiteboard.
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
                Wedflow is a wedding ecosystem — a mobile-first platform where
                couples craft their wedding through cinematic-quality planning
                tools (photo plans, seating charts, day-of timelines, vendor
                deliveries, cultural traditions), while a curated community of
                Scandinavian vendors connects with the right couples through
                rich profiles and direct conversation. Built with
                Scandinavian craft, designed for Scandinavian weddings.
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
                  Born Behind the Camera
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
                  based in Oslo. Over 8+ years and 200+ weddings, we've
                  specialized in timeless photography and cinematic wedding
                  films — capturing authentic moments with an artistic eye and
                  telling love stories with emotion and elegance.
                </p>
                <div className="flex items-center gap-8 mt-6 pt-4 border-t border-border">
                  <div>
                    <div className="text-2xl font-serif font-light">200+</div>
                    <p className="text-xs text-muted-foreground">Weddings Filmed</p>
                  </div>
                  <div>
                    <div className="text-2xl font-serif font-light">8+</div>
                    <p className="text-xs text-muted-foreground">
                      Years on Set
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
                  <h3 className="font-medium">What We Witnessed</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Standing behind the camera at hundreds of weddings, we
                  witnessed the same story: the florist arriving late because
                  nobody shared the timeline, the couple panicking over
                  seating 15 minutes before doors opened, the photographer
                  missing the grandfather's speech because no one had a shot
                  list. These aren't tech problems — they're human coordination
                  problems. And no generic app was solving them.
                </p>
              </Card>

              {/* Philosophy */}
              <Card className="p-6 bg-background border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-medium">Craft Over Algorithms</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  We don't believe a wedding can be optimized by an algorithm.
                  Weddings are deeply personal — shaped by culture, family,
                  and story. Our approach is to give couples and vendors the
                  right visual tools for personal connection and creative
                  coordination, not to automate the human decisions that make
                  each wedding unique.
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
                  That's why we built Wedflow — the platform we wished existed
                  when we were the ones on set watching things fall apart. A
                  wedding ecosystem that solves the real-world coordination
                  problems we witnessed first-hand: photo planning, day-of
                  timing, vendor deliveries, seating, and cultural
                  traditions — designed with Scandinavian craft for
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
              Tools Born from Real Weddings
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature exists because we saw the need first-hand — at the
              venue, behind the camera, at 2 AM editing timelines.
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

        {/* For Vendors — differentiated from WedMind's "CMS portal" positioning */}
        <section className="bg-card py-20 md:py-28 mb-20 md:mb-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
                  A Curated Vendor Community
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Wedflow is not a directory where anyone uploads a profile.
                  As wedding professionals ourselves, we've built a curated
                  community of Scandinavian vendors who share our commitment
                  to craft. You connect with couples through storytelling, not
                  keyword bidding.
                </p>
                <ul className="space-y-4">
                  {[
                    "Tell your story with a rich portfolio & visual profile",
                    "Receive inquiries from couples who already know your style",
                    "Coordinate deliveries and day-of logistics through shared timelines",
                    "Threaded conversations — no lost emails or chat groups",
                    "Grow organically through reviews and couple referrals",
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
            Built by Wedding Professionals,<br />for Wedding Professionals
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Wedflow isn't another planning checklist — it's the wedding
            ecosystem that Norwedfilm spent 8 years wishing existed. For
            couples who want to craft a meaningful day, and for vendors who
            take pride in their craft.
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
