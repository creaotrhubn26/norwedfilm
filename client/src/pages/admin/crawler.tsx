import { AdminLayout } from "@/components/admin/admin-layout";
import { CrawlerDashboard } from "@/components/cms/crawler-dashboard";

export default function AdminCrawler() {
  return (
    <AdminLayout title="SEO Crawler">
      <div className="p-6">
        <CrawlerDashboard />
      </div>
    </AdminLayout>
  );
}
