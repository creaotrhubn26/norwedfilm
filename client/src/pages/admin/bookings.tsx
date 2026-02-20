import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Loader2, Calendar, Check, X, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Booking, BlockedDate } from "@shared/schema";

export default function AdminBookings() {
  const { toast } = useToast();
  const [blockDateDialogOpen, setBlockDateDialogOpen] = useState(false);
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: blockedDates } = useQuery<BlockedDate[]>({
    queryKey: ["/api/admin/blocked-dates"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/bookings/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Booking status updated" });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Booking deleted" });
    },
  });

  const blockDateMutation = useMutation({
    mutationFn: (data: { date: string; reason?: string }) =>
      apiRequest("POST", "/api/admin/blocked-dates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blocked-dates"] });
      toast({ title: "Date blocked" });
      setBlockDateDialogOpen(false);
      setBlockDate("");
      setBlockReason("");
    },
  });

  const unblockDateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/blocked-dates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blocked-dates"] });
      toast({ title: "Date unblocked" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-red-600"><X className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const pendingCount = bookings?.filter(b => b.status === "pending").length || 0;
  const confirmedCount = bookings?.filter(b => b.status === "confirmed").length || 0;

  return (
    <AdminLayout title="Bookings & Calendar">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Blocked Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blockedDates?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Booking Requests</h2>
          <Dialog open={blockDateDialogOpen} onOpenChange={setBlockDateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-block-date">
                <Calendar className="w-4 h-4 mr-2" />
                Block Date
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block a Date</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    data-testid="input-block-date"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reason (optional)</label>
                  <Input
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="e.g., Vacation, Already booked"
                    data-testid="input-block-reason"
                  />
                </div>
                <Button
                  onClick={() => blockDateMutation.mutate({ date: blockDate, reason: blockReason })}
                  disabled={!blockDate || blockDateMutation.isPending}
                  className="w-full"
                  data-testid="button-confirm-block"
                >
                  {blockDateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Block Date
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
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
              ) : bookings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No booking requests yet
                  </TableCell>
                </TableRow>
              ) : (
                bookings?.map((booking) => (
                  <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {booking.date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.clientName}</div>
                        <div className="text-sm text-muted-foreground">{booking.clientEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{booking.eventType || "-"}</TableCell>
                    <TableCell>{booking.location || "-"}</TableCell>
                    <TableCell>{getStatusBadge(booking.status || "pending")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Select
                          value={booking.status || "pending"}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: booking.id, status })}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this booking?")) {
                              deleteBookingMutation.mutate(booking.id);
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

        {blockedDates && blockedDates.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">Blocked Dates</h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedDates.map((blocked) => (
                    <TableRow key={blocked.id}>
                      <TableCell>{blocked.date}</TableCell>
                      <TableCell>{blocked.reason || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unblockDateMutation.mutate(blocked.id)}
                        >
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
