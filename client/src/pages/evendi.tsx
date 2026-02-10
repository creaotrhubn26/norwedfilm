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
  Building2,
  Eye,
  ClipboardList,
  ArrowRight,
  Film,
  AlertCircle,
  Truck,
  Sparkles,
  Handshake,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Handshake,
    title: "Matching & Booking",
    description:
      "Koble riktig leverandør med riktig kunde – basert på type arrangement, lokasjon, kapasitet og preferanser. Ingen manuelle tilbudsrunder.",
  },
  {
    icon: Calendar,
    title: "Koordinert Tidslinje",
    description:
      "En felles tidslinje for alle involverte – fra oppsett til nedrigg. Dele live med koordinatorer og leverandører.",
  },
  {
    icon: Truck,
    title: "Leveransesporing",
    description:
      "Spor hva hver leverandør leverer, når det ankommer, og hvem som har ansvar. Slutt på kaos og ubesvarte e-poster.",
  },
  {
    icon: ClipboardList,
    title: "Oppgaver & Milepæler",
    description:
      "Visuell fremdrift gjennom hele planleggingsprosessen. Milepæler, frister og påminnelser tilpasset ditt arrangement.",
  },
  {
    icon: Building2,
    title: "Venues & Lokaler",
    description:
      "Finn og sammenlign venues basert på kapasitet, beliggenhet og fasiliteter. Perfekt for bryllup, konferanser og firmafester.",
  },
  {
    icon: MessageSquare,
    title: "Meldinger & Dialog",
    description:
      "Trådbaserte samtaler med alle leverandører, organisert per arrangement. Ingen tapte e-poster, ingen rotete chat-grupper.",
  },
  {
    icon: Eye,
    title: "Profil & Ønskeliste",
    description:
      "Del din visjon, preferanser og krav – slik at leverandørene forstår behovet ditt før første møte.",
  },
  {
    icon: Sparkles,
    title: "Skreddersydd Matching",
    description:
      "Intelligent matching basert på arrangementtype, budsjett og stil. Fra bryllup til bedriftseventer – riktig leverandør til riktig jobb.",
  },
];

export default function EvendiPage() {
  return (
    <PublicLayout>
      <div className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20 md:mb-28">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-sm font-medium text-foreground mb-6">
            <Globe className="w-4 h-4" />
            Norwedfilm er samarbeidspartner med Evendi
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            Evendi
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-4">
            Evendi kobler bedrifter, venues og leverandører i ett samlet
            økosystem. Plattformen muliggjør matching, booking, kontrakt og
            koordinering.
          </p>
          <p className="text-muted-foreground/80 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Vi reduserer friksjon, manuell e-post og uoversiktlige
            tilbudsrunder. Evendi gjør event-gjennomføring like enkel som å
            bestille mat eller overnatting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="min-w-[200px]" data-testid="button-evendi-contact">
                Kom i gang
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#vision">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px]"
                data-testid="button-evendi-vision"
              >
                Vår visjon
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
                Evendi-visjonen
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Inspirert av Simon Sineks Golden Circle — vi starter med HVORFOR.
            </p>
          </div>

          <div className="space-y-6">
            {/* WHY */}
            <Card className="p-6 md:p-8 border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-400 text-white font-bold text-sm">
                  HVORFOR
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-light text-amber-700 dark:text-amber-400">
                  Hvorfor vi finnes
                </h3>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                Etter å ha filmet 200+ bryllup og arrangementer så vi det
                samme igjen og igjen: arrangører druknet i regneark,
                leverandører mistet oversikten fordi logistikken sviktet, og
                flotte arrangementer ble undergravd av unødvendig kaos.
                Evendi finnes fordi vi nekter å se dette skje — veien til
                et vellykket arrangement skal være like god som selve dagen.
              </p>
            </Card>

            {/* HOW */}
            <Card className="p-6 md:p-8 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  HVORDAN
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-light text-primary">
                  Hvordan vi gjør det
                </h3>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                Ved å samle alt vi har lært bak kamera og på hundrevis av
                arrangementer i smarte, formålsbyggede verktøy: matching av
                leverandører og venues, felles tidslinje for alle involverte,
                leveransesporing, trådbaserte samtaler og kontrakt-håndtering.
                Hvert verktøy finnes fordi vi har sett behovet i praksis —
                ikke på et whiteboard.
              </p>
            </Card>

            {/* WHAT */}
            <Card className="p-6 md:p-8 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-sm">
                  HVA
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-light text-emerald-600 dark:text-emerald-400">
                  Hva vi tilbyr
                </h3>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                Evendi er et komplett økosystem for arrangementer — en
                plattform der bedrifter og privatpersoner planlegger alt fra
                bryllup til konferanser, firmafester og seminarer. Et
                kuratert nettverk av leverandører, venues og tjenester
                kobles sammen gjennom matching, booking og koordinering.
                Bygget med skandinavisk kvalitet, designet for alle typer
                arrangementer.
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
                  Født bak kamera
                </h2>
              </div>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                "Love stories elegantly told" — Norwedfilm er
                samarbeidspartner med Evendi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Who */}
              <Card className="p-6 bg-background border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Film className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-medium">Hvem er Norwedfilm?</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Norwedfilm er et bryllupsfoto- og videostudio basert i Oslo.
                  Gjennom 8+ år og 200+ bryllup har vi spesialisert oss på
                  tidløs fotografi og cinematiske bryllupsfilmer — vi fanger
                  autentiske øyeblikk med et kunstnerisk blikk og forteller
                  kjærlighetshistorier med følelse og eleganse.
                </p>
                <div className="flex items-center gap-8 mt-6 pt-4 border-t border-border">
                  <div>
                    <div className="text-2xl font-serif font-light">200+</div>
                    <p className="text-xs text-muted-foreground">Bryllup filmet</p>
                  </div>
                  <div>
                    <div className="text-2xl font-serif font-light">8+</div>
                    <p className="text-xs text-muted-foreground">
                      År med erfaring
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
                  <h3 className="font-medium">Hva vi så fra sidelinjen</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Bak kameraet på hundrevis av arrangementer så vi det samme:
                  blomsterdekoratøren som kom for sent fordi ingen delte
                  tidsplanen, paret som panikkerte over bordplassering 15
                  minutter før dørene åpnet, fotografen som gikk glipp av
                  bestefars tale fordi ingen hadde en fotoplan. Dette er ikke
                  teknologiproblemer — det er koordineringsproblemer mellom
                  mennesker.
                </p>
              </Card>

              {/* Philosophy */}
              <Card className="p-6 bg-background border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-medium">Håndverk over algoritmer</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Vi tror ikke et arrangement kan optimaliseres av en
                  algoritme. Arrangementer er dypt personlige — formet av
                  kultur, folk og visjon. Vår tilnærming er å gi arrangører
                  og leverandører de rette verktøyene for samarbeid og
                  koordinering, ikke å automatisere de menneskelige
                  beslutningene som gjør hvert arrangement unikt.
                </p>
              </Card>

              {/* Solution */}
              <Card className="p-6 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-medium text-emerald-700 dark:text-emerald-400">
                    Løsningen: Evendi
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Derfor bygde vi Evendi — plattformen vi ønsket fantes da vi
                  selv stod på settet og så ting falle fra hverandre. Et
                  komplett økosystem som løser de virkelige
                  koordineringsproblemene vi opplevde: matching, booking,
                  tidslinje, leveranser og kontrakter — designet for alle
                  typer arrangementer.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-28">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4">
              Verktøy født fra virkelige arrangementer
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hvert verktøy finnes fordi vi så behovet førstehånds — på venue,
              bak kamera, klokken to om natten mens vi redigerte tidsplaner.
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
                  Et kuratert leverandørnettverk
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Evendi er ikke en katalog der hvem som helst laster opp en
                  profil. Vi bygger et kuratert nettverk av leverandører og
                  venues som deler vår forpliktelse til kvalitet. Du kobles
                  med rette kunder gjennom matching — ikke gjennom
                  søkeordbudgivning.
                </p>
                <ul className="space-y-4">
                  {[
                    "Vis frem ditt arbeid med en rik portefølje og visuell profil",
                    "Motta henvendelser fra kunder som matcher dine tjenester",
                    "Koordiner leveranser og logistikk gjennom delte tidslinjer",
                    "Trådbaserte samtaler — ingen tapte e-poster eller chat-grupper",
                    "Voks gjennom anmeldelser og kundehenvisninger",
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
                    Leverandør
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">
            Bygget av arrangementsproffene,<br />for arrangementsproffene
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Evendi er ikke nok en sjekkliste — det er det komplette
            økosystemet som Norwedfilm brukte 8 år på å ønske seg. For
            arrangører som vil skape noe meningsfylt, og for leverandører
            som er stolte av sitt håndverk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="min-w-[200px]" data-testid="button-evendi-cta">
                Kontakt oss
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px]"
                data-testid="button-evendi-about"
              >
                Om Norwedfilm
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
