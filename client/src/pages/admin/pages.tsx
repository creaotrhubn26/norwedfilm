import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Page } from "@shared/schema";
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
} from "@/components/ui/form";

const pageSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  published: z.boolean().default(true),
});

type PageFormValues = z.infer<typeof pageSchema>;

export default function AdminPages() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);

  const { data: pages, isLoading } = useQuery<Page[]>({
    queryKey: ["/api/admin/pages"],
  });

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      slug: "",
      title: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      published: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PageFormValues) => apiRequest("POST", "/api/admin/pages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "Page created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create page", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PageFormValues }) =>
      apiRequest("PATCH", `/api/admin/pages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "Page updated successfully" });
      setIsDialogOpen(false);
      setEditingPage(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update page", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/pages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "Page deleted" });
    },
  });

  const openEditDialog = (page: Page) => {
    setEditingPage(page);
    form.reset({
      slug: page.slug,
      title: page.title,
      content: page.content || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      published: page.published ?? true,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPage(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: PageFormValues) => {
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <AdminLayout title="Pages">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Manage custom pages and content
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-page">
                <Plus className="w-4 h-4 mr-2" />
                Add Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPage ? "Edit Page" : "Add New Page"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-page-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="my-page" data-testid="input-page-slug" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="min-h-[200px]"
                            placeholder="Page content..."
                            data-testid="input-page-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-4">SEO Settings</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="metaTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Title</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-meta-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-[80px]"
                                data-testid="input-meta-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-published"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Published</FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-page"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingPage ? "Update" : "Create"}
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
                <TableHead>Page</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : pages?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No pages yet. Click "Add Page" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                pages?.map((page) => (
                  <TableRow key={page.id} data-testid={`row-page-${page.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{page.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm text-muted-foreground">/{page.slug}</code>
                    </TableCell>
                    <TableCell>
                      {page.published ? (
                        <Badge variant="outline" className="text-green-600">
                          <Eye className="w-3 h-3 mr-1" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(page)}
                          data-testid={`button-edit-${page.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this page?")) {
                              deleteMutation.mutate(page.id);
                            }
                          }}
                          data-testid={`button-delete-${page.id}`}
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
