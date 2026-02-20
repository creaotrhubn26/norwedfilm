import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HeroSlide } from "@shared/schema";
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

const heroSlideSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  sortOrder: z.number().default(0),
  active: z.boolean().default(true),
});

type HeroSlideFormValues = z.infer<typeof heroSlideSchema>;

export default function AdminHero() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  const { data: slides, isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/admin/hero-slides"],
  });

  const form = useForm<HeroSlideFormValues>({
    resolver: zodResolver(heroSlideSchema),
    defaultValues: {
      imageUrl: "",
      title: "",
      subtitle: "",
      ctaText: "Book Us",
      ctaLink: "/contact",
      sortOrder: 0,
      active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: HeroSlideFormValues) => apiRequest("POST", "/api/admin/hero-slides", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      toast({ title: "Slide added successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add slide", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: HeroSlideFormValues }) =>
      apiRequest("PATCH", `/api/admin/hero-slides/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      toast({ title: "Slide updated successfully" });
      setIsDialogOpen(false);
      setEditingSlide(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update slide", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/hero-slides/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
      toast({ title: "Slide deleted" });
    },
  });

  const openEditDialog = (slide: HeroSlide) => {
    setEditingSlide(slide);
    form.reset({
      imageUrl: slide.imageUrl,
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      ctaText: slide.ctaText || "Book Us",
      ctaLink: slide.ctaLink || "/contact",
      sortOrder: slide.sortOrder || 0,
      active: slide.active ?? true,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSlide(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const onSubmit = (data: HeroSlideFormValues) => {
    if (editingSlide) {
      updateMutation.mutate({ id: editingSlide.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <AdminLayout title="Hero Slides">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Manage the homepage hero slideshow
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} data-testid="button-add-slide">
                <Plus className="w-4 h-4 mr-2" />
                Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingSlide ? "Edit Slide" : "Add New Slide"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." data-testid="input-image-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Love Stories" data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtitle</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Elegantly Told" data-testid="input-subtitle" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ctaText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button Text</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Book Us" data-testid="input-cta-text" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ctaLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button Link</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="/contact" data-testid="input-cta-link" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Active</FormLabel>
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
                      data-testid="button-save-slide"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingSlide ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="aspect-video animate-pulse bg-muted" />
            ))
          ) : slides?.length === 0 ? (
            <Card className="aspect-video flex items-center justify-center col-span-full text-muted-foreground">
              No slides yet. Click "Add Slide" to create one.
            </Card>
          ) : (
            slides?.map((slide) => (
              <Card
                key={slide.id}
                className="relative aspect-video overflow-hidden group"
                data-testid={`card-slide-${slide.id}`}
              >
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt={slide.title || "Hero slide"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4">
                  <p className="font-serif text-white text-xl">{slide.title || "Untitled"}</p>
                  <p className="text-white/80 text-sm">{slide.subtitle}</p>
                </div>

                {!slide.active && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-yellow-500/90 text-yellow-950 text-xs px-2 py-1 rounded">
                      Inactive
                    </span>
                  </div>
                )}

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(slide)}
                    data-testid={`button-edit-${slide.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (confirm("Delete this slide?")) {
                        deleteMutation.mutate(slide.id);
                      }
                    }}
                    data-testid={`button-delete-${slide.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
