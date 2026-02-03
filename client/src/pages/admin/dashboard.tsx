import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FolderOpen, 
  Image, 
  MessageSquare, 
  Star, 
  TrendingUp,
  Eye,
  Clock,
  Mail
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  projects: number;
  media: number;
  contacts: number;
  reviews: number;
  newContacts: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentContacts } = useQuery<any[]>({
    queryKey: ["/api/admin/contacts"],
  });

  const statCards = [
    {
      title: "Total Projects",
      value: stats?.projects || 0,
      icon: FolderOpen,
      href: "/admin/projects",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Media Items",
      value: stats?.media || 0,
      icon: Image,
      href: "/admin/media",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Contact Messages",
      value: stats?.contacts || 0,
      icon: MessageSquare,
      href: "/admin/contacts",
      color: "text-green-600 dark:text-green-400",
      badge: stats?.newContacts ? `${stats.newContacts} new` : undefined,
    },
    {
      title: "Reviews",
      value: stats?.reviews || 0,
      icon: Star,
      href: "/admin/reviews",
      color: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Link key={stat.href} href={stat.href}>
              <Card className="hover-elevate cursor-pointer" data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">
                      {isLoading ? "-" : stat.value}
                    </div>
                    {stat.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Recent Messages</CardTitle>
              <Link href="/admin/contacts">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentContacts?.slice(0, 5).map((contact: any) => (
                <div
                  key={contact.id}
                  className="flex items-start gap-3 py-3 border-b border-border last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      {contact.status === "new" && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.message}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No messages yet
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/admin/projects">
                <Button variant="outline" className="w-full justify-start" data-testid="button-add-project">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Add New Project
                </Button>
              </Link>
              <Link href="/admin/hero">
                <Button variant="outline" className="w-full justify-start" data-testid="button-edit-hero">
                  <Image className="w-4 h-4 mr-2" />
                  Edit Hero Slides
                </Button>
              </Link>
              <Link href="/admin/reviews">
                <Button variant="outline" className="w-full justify-start" data-testid="button-manage-reviews">
                  <Star className="w-4 h-4 mr-2" />
                  Manage Reviews
                </Button>
              </Link>
              <Link href="/" target="_blank">
                <Button variant="outline" className="w-full justify-start" data-testid="button-view-site">
                  <Eye className="w-4 h-4 mr-2" />
                  View Live Site
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
