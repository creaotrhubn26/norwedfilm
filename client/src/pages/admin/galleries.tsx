import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Loader2, Lock, Eye, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ClientGallery, Project } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const gallerySchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  projectId: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal("")),
  downloadEnabled: z.boolean().default(true),
});

type GalleryFormValues = z.infer<typeof gallerySchema>;

export default function AdminGalleries() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<ClientGallery | null>(null);

  const { data: galleries, isLoading } = useQuery<ClientGallery[]>({
    queryKey: ["/api/admin/galleries"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/admin/projects"],
  });

  const form = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: "",
      slug: "",
      password: "",
      projectId: "",
      clientName: "",
      clientEmail: "",
      downloadEnabled: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GalleryFormValues) => apiRequest("POST", "/api/admin/galleries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
      toast({ title: "Gallery created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create gallery", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GalleryFormValues }) =>
      apiRequest("PATCH", `/api/admin/galleries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
      toast({ title: "Gallery updated" });
      setIsDialogOpen(false);
      setEditingGallery(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/galleries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/galleries"] });
      toast({ title: "Gallery deleted" });
    },
  });

  const openEditDialog = (gallery: ClientGallery) => {
    setEditingGallery(gallery);
    form.reset({
      title: gallery.title,
      slug: gallery.slug,
      password: gallery.password,
      projectId: gallery.projectId || "",
      clientName: gallery.clientName || "",
      clientEmail: gallery.clientEmail || "",
      downloadEnabled: gallery.downloadEnabled ?? true,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingGallery(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: GalleryFormValues) => {
    if (editingGallery) {
      updateMutation.mutate({ id: editingGallery.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/gallery/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <AdminLayout title="Client Galleries">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Create password-protected galleries for your clients
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-gallery">
                <Plus className="w-4 h-4 mr-2" />
                New Gallery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingGallery ? "Edit Gallery" : "Create Client Gallery"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gallery Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Emma & Lars Wedding" data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="emma-lars" data-testid="input-slug" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="text" data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Project</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project">
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link to a project to use its media in this gallery
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-client-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-client-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="downloadEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-download"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Allow downloads</FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-gallery"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingGallery ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gallery</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : galleries?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No client galleries yet
                  </TableCell>
                </TableRow>
              ) : (
                galleries?.map((gallery) => (
                  <TableRow key={gallery.id} data-testid={`row-gallery-${gallery.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">{gallery.title}</span>
                          <p className="text-xs text-muted-foreground">/gallery/{gallery.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {gallery.clientName || gallery.clientEmail || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Eye className="w-3 h-3 mr-1" />
                        {gallery.viewCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {gallery.downloadEnabled ? (
                        <Badge variant="outline" className="text-green-600">
                          <Download className="w-3 h-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyLink(gallery.slug)} title="Copy link">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(gallery)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this gallery?")) {
                              deleteMutation.mutate(gallery.id);
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
