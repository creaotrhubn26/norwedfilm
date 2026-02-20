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
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project } from "@shared/schema";
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

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  coverImage: z.string().optional(),
  videoUrl: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function AdminProjects() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/admin/projects"],
  });

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      category: "wedding-photo",
      coverImage: "",
      videoUrl: "",
      date: "",
      location: "",
      featured: false,
      published: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectFormValues) => apiRequest("POST", "/api/admin/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Project created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectFormValues }) =>
      apiRequest("PATCH", `/api/admin/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({ title: "Project updated successfully" });
      setIsDialogOpen(false);
      setEditingProject(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update project", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Project deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
  });

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    form.reset({
      title: project.title,
      slug: project.slug,
      description: project.description || "",
      category: project.category,
      coverImage: project.coverImage || "",
      videoUrl: project.videoUrl || "",
      date: project.date || "",
      location: project.location || "",
      featured: project.featured || false,
      published: project.published ?? true,
      sortOrder: project.sortOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: ProjectFormValues) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <AdminLayout title="Projects">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Manage your wedding photography and videography portfolio
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-project">
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? "Edit Project" : "Add New Project"}
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
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!editingProject) {
                                  form.setValue("slug", generateSlug(e.target.value));
                                }
                              }}
                              data-testid="input-project-title"
                            />
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
                            <Input {...field} data-testid="input-project-slug" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wedding-photo">Wedding Photography</SelectItem>
                            <SelectItem value="wedding-video">Wedding Videography</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="min-h-[80px]"
                            data-testid="input-project-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Oslo, Norway" data-testid="input-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Summer 2024" data-testid="input-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." data-testid="input-cover-image" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL (for video projects)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://vimeo.com/..." data-testid="input-video-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-6">
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-featured"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Featured</FormLabel>
                        </FormItem>
                      )}
                    />
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
                  </div>

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
                      data-testid="button-save-project"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingProject ? "Update" : "Create"}
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
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
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
              ) : projects?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No projects yet. Click "Add Project" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                projects?.map((project) => (
                  <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                          {project.coverImage ? (
                            <img
                              src={project.coverImage}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{project.title}</p>
                          <p className="text-sm text-muted-foreground">{project.date}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {project.category === "wedding-photo" ? "Photo" : "Video"}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.location || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {project.published ? (
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
                        {project.featured && (
                          <Badge>Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(project)}
                          data-testid={`button-edit-${project.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this project?")) {
                              deleteMutation.mutate(project.id);
                            }
                          }}
                          data-testid={`button-delete-${project.id}`}
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
