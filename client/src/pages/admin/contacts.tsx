import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Calendar, Loader2, Eye, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";
import { useState } from "react";
import { format } from "date-fns";

export default function AdminContacts() {
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/admin/contacts"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/contacts/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Message deleted" });
    },
  });

  return (
    <AdminLayout title="Contact Messages">
      <div className="p-6">
        <p className="text-muted-foreground mb-6">
          Manage contact form submissions from potential clients
        </p>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Event Details</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
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
              ) : contacts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No messages yet
                  </TableCell>
                </TableRow>
              ) : (
                contacts?.map((contact) => (
                  <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        {contact.phone && (
                          <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {contact.eventType && <p>{contact.eventType}</p>}
                        {contact.eventDate && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {contact.eventDate}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">{contact.message}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={contact.status || "new"}
                        onValueChange={(value) =>
                          updateMutation.mutate({ id: contact.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-28" data-testid={`select-status-${contact.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {contact.createdAt
                          ? format(new Date(contact.createdAt), "MMM d, yyyy")
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedContact(contact)}
                          data-testid={`button-view-${contact.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this message?")) {
                              deleteMutation.mutate(contact.id);
                            }
                          }}
                          data-testid={`button-delete-${contact.id}`}
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

        <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Message Details</DialogTitle>
            </DialogHeader>
            {selectedContact && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Name</p>
                    <p>{selectedContact.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Email</p>
                    <p>{selectedContact.email}</p>
                  </div>
                  {selectedContact.phone && (
                    <div>
                      <p className="font-medium text-muted-foreground">Phone</p>
                      <p>{selectedContact.phone}</p>
                    </div>
                  )}
                  {selectedContact.eventDate && (
                    <div>
                      <p className="font-medium text-muted-foreground">Event Date</p>
                      <p>{selectedContact.eventDate}</p>
                    </div>
                  )}
                  {selectedContact.eventType && (
                    <div>
                      <p className="font-medium text-muted-foreground">Service</p>
                      <p>{selectedContact.eventType}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-sm mb-2">Message</p>
                  <p className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">
                    {selectedContact.message}
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedContact(null)}>
                    Close
                  </Button>
                  <Button asChild>
                    <a href={`mailto:${selectedContact.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Reply
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
