import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Loader2, Download, Mail, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subscriber } from "@shared/schema";
import { format } from "date-fns";

export default function AdminSubscribers() {
  const { toast } = useToast();

  const { data: subscribers, isLoading } = useQuery<Subscriber[]>({
    queryKey: ["/api/admin/subscribers"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/subscribers/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscribers"] });
      toast({ title: "Subscriber status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/subscribers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscribers"] });
      toast({ title: "Subscriber deleted" });
    },
  });

  const exportToCSV = () => {
    if (!subscribers?.length) return;
    
    const headers = ["Email", "Name", "Status", "Source", "Subscribed Date"];
    const rows = subscribers.map(s => [
      s.email,
      s.name || "",
      s.status || "active",
      s.source || "",
      s.createdAt ? format(new Date(s.createdAt), "yyyy-MM-dd") : "",
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Subscribers exported to CSV" });
  };

  const activeCount = subscribers?.filter(s => s.status === "active").length || 0;
  const unsubscribedCount = subscribers?.filter(s => s.status === "unsubscribed").length || 0;

  return (
    <AdminLayout title="Newsletter Subscribers">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {activeCount} active
            </Badge>
            <Badge variant="outline" className="text-sm text-muted-foreground">
              {unsubscribedCount} unsubscribed
            </Badge>
          </div>
          <Button onClick={exportToCSV} variant="outline" data-testid="button-export-csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : subscribers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No subscribers yet
                  </TableCell>
                </TableRow>
              ) : (
                subscribers?.map((subscriber) => (
                  <TableRow key={subscriber.id} data-testid={`row-subscriber-${subscriber.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {subscriber.email}
                      </div>
                    </TableCell>
                    <TableCell>{subscriber.name || "-"}</TableCell>
                    <TableCell>{subscriber.source || "-"}</TableCell>
                    <TableCell>
                      {subscriber.status === "active" ? (
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Unsubscribed</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscriber.createdAt && format(new Date(subscriber.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {subscriber.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => updateStatusMutation.mutate({ id: subscriber.id, status: "unsubscribed" })}
                            title="Unsubscribe"
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this subscriber?")) {
                              deleteMutation.mutate(subscriber.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
