import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import AboutPage from "@/pages/about";
import PortfolioPage from "@/pages/portfolio";
import ContactPage from "@/pages/contact";
import ReviewsPage from "@/pages/reviews";
import ProjectPage from "@/pages/project";
import EvendiPage from "@/pages/evendi";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminProjects from "@/pages/admin/projects";
import AdminMedia from "@/pages/admin/media";
import AdminPages from "@/pages/admin/pages";
import AdminContacts from "@/pages/admin/contacts";
import AdminReviews from "@/pages/admin/reviews";
import AdminHero from "@/pages/admin/hero";
import AdminSettings from "@/pages/admin/settings";
import AdminBlog from "@/pages/admin/blog";
import AdminSubscribers from "@/pages/admin/subscribers";
import AdminGalleries from "@/pages/admin/galleries";
import AdminBookings from "@/pages/admin/bookings";
import AdminVisualEditor from "@/pages/admin/visual-editor";
import AdminCrawler from "@/pages/admin/crawler";
import AdminLogin from "@/pages/admin/login";
import AdminLoginCallback from "@/pages/admin/login-callback";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/portfolio/:category" component={PortfolioPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/evendi" component={EvendiPage} />
      <Route path="/project/:slug" component={ProjectPage} />

      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/login/callback" component={AdminLoginCallback} />
      
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/projects" component={AdminProjects} />
      <Route path="/admin/media" component={AdminMedia} />
      <Route path="/admin/pages" component={AdminPages} />
      <Route path="/admin/contacts" component={AdminContacts} />
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/admin/hero" component={AdminHero} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/subscribers" component={AdminSubscribers} />
      <Route path="/admin/galleries" component={AdminGalleries} />
      <Route path="/admin/bookings" component={AdminBookings} />
      <Route path="/admin/visual-editor" component={AdminVisualEditor} />
      <Route path="/admin/crawler" component={AdminCrawler} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
