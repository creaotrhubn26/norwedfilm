import express, { type Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import {
  insertProjectSchema,
  insertMediaSchema,
  insertPageSchema,
  insertContactSchema,
  insertReviewSchema,
  insertHeroSlideSchema,
  insertBlogPostSchema,
  insertClientGallerySchema,
  insertBlockedDateSchema,
} from "@shared/schema";
import { z } from "zod";

const subscriberStatusSchema = z.object({
  status: z.enum(["active", "unsubscribed"]),
});

const bookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

const galleryAccessSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const cmsFeatureSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  icon: z.string().default("Star"),
  title: z.string().min(1),
  description: z.string().default(""),
  display_order: z.number().default(0),
  is_active: z.boolean().default(true),
});

const cmsPartnerSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1),
  logo_url: z.string().default(""),
  website_url: z.string().nullable().optional(),
  display_order: z.number().default(0),
  is_active: z.boolean().default(true),
});

const cmsSectionsSchema = z.object({
  features_title: z.string().nullable().optional(),
  features_subtitle: z.string().nullable().optional(),
  testimonials_title: z.string().nullable().optional(),
  testimonials_subtitle: z.string().nullable().optional(),
  cta_title: z.string().nullable().optional(),
  cta_subtitle: z.string().nullable().optional(),
  cta_button_text: z.string().nullable().optional(),
  contact_title: z.string().nullable().optional(),
  contact_subtitle: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  partners_title: z.string().nullable().optional(),
  partners_subtitle: z.string().nullable().optional(),
});

const cmsHeroSchema = z.object({
  title: z.string().default(""),
  title_highlight: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  cta_primary_text: z.string().nullable().optional(),
  cta_primary_url: z.string().nullable().optional(),
  cta_secondary_text: z.string().nullable().optional(),
  cta_secondary_url: z.string().nullable().optional(),
  background_image: z.string().nullable().optional(),
});

const cmsTestimonialSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  quote: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(""),
  avatar_url: z.string().nullable().optional(),
  display_order: z.number().default(0),
  is_active: z.boolean().default(true),
});

const cmsContentTypeSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  is_system: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

const cmsContentFieldSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().optional(),
  placeholder: z.string().nullable().optional(),
  help_text: z.string().nullable().optional(),
  default_value: z.any().optional(),
  options: z.array(z.any()).optional(),
  validation_rules: z.record(z.any()).optional(),
  display_order: z.number().optional(),
});

const cmsActivitySchema = z.object({
  id: z.union([z.number(), z.string()]),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.union([z.number(), z.string()]).nullable(),
  resource_name: z.string().nullable(),
  user_name: z.string().nullable(),
  created_at: z.string(),
});

function parseJsonValue<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getNextNumericId(items: Array<{ id?: string | number }>): number {
  const maxId = items.reduce((max, item) => {
    const num = Number(item.id);
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return maxId + 1;
}

async function getCmsContentTypes() {
  const setting = await storage.getSetting("cms_content_types");
  return parseJsonValue<Array<Record<string, any>>>(setting?.value, []);
}

async function saveCmsContentTypes(types: Array<Record<string, any>>) {
  await storage.upsertSetting("cms_content_types", JSON.stringify(types), "json");
}

async function getCmsContentFields() {
  const setting = await storage.getSetting("cms_content_fields");
  return parseJsonValue<Array<Record<string, any>>>(setting?.value, []);
}

async function saveCmsContentFields(fields: Array<Record<string, any>>) {
  await storage.upsertSetting("cms_content_fields", JSON.stringify(fields), "json");
}

async function getCmsActivityLog() {
  const setting = await storage.getSetting("cms_activity_log");
  return parseJsonValue<Array<z.infer<typeof cmsActivitySchema>>>(setting?.value, []);
}

async function appendCmsActivity(params: {
  action: string;
  resourceType: string;
  resourceId?: string | number | null;
  resourceName?: string | null;
  userName?: string;
}) {
  const current = await getCmsActivityLog();
  const created = cmsActivitySchema.parse({
    id: randomUUID(),
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    resource_name: params.resourceName ?? null,
    user_name: params.userName ?? "Admin",
    created_at: new Date().toISOString(),
  });

  const updated = [created, ...current].slice(0, 200);
  await storage.upsertSetting("cms_activity_log", JSON.stringify(updated), "json");
}

async function buildCmsLandingPayload() {
  const [heroSlides, reviews, featuresSetting, partnersSetting, sectionsSetting, heroMetaSetting] = await Promise.all([
    storage.getHeroSlides(),
    storage.getReviews(),
    storage.getSetting("cms_landing_features"),
    storage.getSetting("cms_landing_partners"),
    storage.getSetting("cms_landing_sections"),
    storage.getSetting("cms_landing_hero_meta"),
  ]);

  const features = parseJsonValue<any[]>(featuresSetting?.value, []);
  const partners = parseJsonValue<any[]>(partnersSetting?.value, []);
  const sections = parseJsonValue<any>(sectionsSetting?.value, {
    features_title: "Funksjoner",
    features_subtitle: null,
    testimonials_title: "Anmeldelser",
    testimonials_subtitle: null,
    cta_title: "Klar for å booke?",
    cta_subtitle: null,
    cta_button_text: "Kontakt oss",
    contact_title: "Kontakt",
    contact_subtitle: null,
    contact_email: "hello@norwedfilm.no",
    contact_phone: "+47 123 45 678",
    partners_title: "Samarbeidspartnere",
    partners_subtitle: null,
  });
  const heroMeta = parseJsonValue<any>(heroMetaSetting?.value, {});

  const firstSlide = heroSlides[0];
  const hero = firstSlide
    ? {
        id: firstSlide.id,
        title: heroMeta.title ?? firstSlide.title ?? "",
        title_highlight: heroMeta.title_highlight ?? null,
        subtitle: heroMeta.subtitle ?? firstSlide.subtitle ?? null,
        cta_primary_text: heroMeta.cta_primary_text ?? firstSlide.ctaText ?? null,
        cta_primary_url: heroMeta.cta_primary_url ?? firstSlide.ctaLink ?? null,
        cta_secondary_text: heroMeta.cta_secondary_text ?? null,
        cta_secondary_url: heroMeta.cta_secondary_url ?? null,
        background_image: heroMeta.background_image ?? firstSlide.imageUrl ?? null,
      }
    : null;

  const testimonials = reviews.map((review, index) => ({
    id: review.id,
    quote: review.content,
    name: review.name,
    role: review.eventType ?? "Kunde",
    avatar_url: review.photo,
    display_order: index,
    is_active: review.published ?? true,
  }));

  return {
    hero,
    features,
    testimonials,
    partners,
    sections,
  };
}

async function buildCmsNavigationPayload() {
  const setting = await storage.getSetting("cms_navigation_header");
  const defaultNav = [
    { id: 1, label: "Home", url: "/", order: 0, isActive: true },
    { id: 2, label: "About", url: "/about", order: 1, isActive: true },
    { id: 3, label: "Portfolio", url: "/portfolio/wedding-photo", order: 2, isActive: true },
    { id: 4, label: "Reviews", url: "/reviews", order: 3, isActive: true },
    { id: 5, label: "Contact", url: "/contact", order: 4, isActive: true },
  ];

  return { items: parseJsonValue(setting?.value, defaultNav) };
}

const uploadsDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isAllowed =
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/") ||
      file.mimetype === "application/pdf";

    if (!isAllowed) {
      return cb(new Error("Only image, video, and PDF files are allowed"));
    }

    cb(null, true);
  },
});

async function generateVideoThumbnail(videoPath: string, sourceFilename: string): Promise<string | null> {
  const parsed = path.parse(sourceFilename);
  const thumbnailFilename = `${parsed.name}-thumb.jpg`;
  const thumbnailPath = path.join(uploadsDir, thumbnailFilename);

  return new Promise((resolve) => {
    ffmpeg(videoPath)
      .outputOptions(["-frames:v 1", "-q:v 2", "-vf scale=960:-1"])
      .on("end", () => resolve(`/uploads/${thumbnailFilename}`))
      .on("error", (error) => {
        console.warn("Video thumbnail generation failed:", error);
        resolve(null);
      })
      .save(thumbnailPath);
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  app.use("/uploads", express.static(uploadsDir));

  // ==========================================
  // PUBLIC API ROUTES
  // ==========================================

  // Get published projects
  app.get("/api/projects", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const projects = category
        ? await storage.getProjectsByCategory(category)
        : await storage.getPublishedProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get project by slug
  app.get("/api/projects/:slug", async (req, res) => {
    try {
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Get project media
  app.get("/api/projects/:slug/media", async (req, res) => {
    try {
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      const media = await storage.getMediaByProject(project.id);
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // Get published reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getPublishedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Submit contact form
  app.post("/api/contacts", async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  // Get hero slides
  app.get("/api/hero-slides", async (req, res) => {
    try {
      const slides = await storage.getActiveHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ message: "Failed to fetch hero slides" });
    }
  });

  // Get public gallery by slug
  app.get("/api/galleries/:slug", async (req, res) => {
    try {
      const gallery = await storage.getClientGalleryBySlug(req.params.slug);
      if (!gallery) {
        return res.status(404).json({ message: "Gallery not found" });
      }

      const { password: _password, ...safeGallery } = gallery;
      res.json(safeGallery);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  // Verify gallery password and return gallery media
  app.post("/api/galleries/:slug/access", async (req, res) => {
    try {
      const data = galleryAccessSchema.parse(req.body);
      const gallery = await storage.getClientGalleryBySlug(req.params.slug);

      if (!gallery) {
        return res.status(404).json({ message: "Gallery not found" });
      }

      if (gallery.password !== data.password) {
        return res.status(401).json({ message: "Invalid password" });
      }

      if (gallery.expiresAt && new Date(gallery.expiresAt) < new Date()) {
        return res.status(410).json({ message: "Gallery has expired" });
      }

      if (gallery.projectId) {
        const galleryMedia = await storage.getMediaByProject(gallery.projectId);
        await storage.incrementGalleryViewCount(gallery.id);

        const { password: _password, ...safeGallery } = gallery;
        return res.json({ gallery: safeGallery, media: galleryMedia });
      }

      await storage.incrementGalleryViewCount(gallery.id);
      const { password: _password, ...safeGallery } = gallery;
      return res.json({ gallery: safeGallery, media: [] });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error accessing gallery:", error);
      res.status(500).json({ message: "Failed to access gallery" });
    }
  });

  app.get("/api/cms/landing/public", async (_req, res) => {
    try {
      const payload = await buildCmsLandingPayload();
      res.json(payload);
    } catch (error) {
      console.error("Error fetching public CMS landing data:", error);
      res.status(500).json({ error: "Failed to fetch landing data" });
    }
  });

  app.get("/api/cms/navigation/public", async (_req, res) => {
    try {
      const payload = await buildCmsNavigationPayload();
      res.json(payload);
    } catch (error) {
      console.error("Error fetching public CMS navigation:", error);
      res.status(500).json({ error: "Failed to fetch navigation" });
    }
  });

  // ==========================================
  // CMS VISUAL EDITOR ROUTES (Protected)
  // ==========================================

  app.get("/api/cms/landing", isAuthenticated, async (_req, res) => {
    try {
      const payload = await buildCmsLandingPayload();
      res.json(payload);
    } catch (error) {
      console.error("Error fetching CMS landing data:", error);
      res.status(500).json({ error: "Failed to fetch landing data" });
    }
  });

  app.post("/api/cms/hero", isAuthenticated, async (req, res) => {
    try {
      const data = cmsHeroSchema.parse(req.body);
      const heroSlides = await storage.getHeroSlides();
      const firstSlide = heroSlides[0];

      if (firstSlide) {
        await storage.updateHeroSlide(String(firstSlide.id), {
          title: data.title,
          subtitle: data.subtitle ?? "",
          ctaText: data.cta_primary_text ?? "",
          ctaLink: data.cta_primary_url ?? "",
          imageUrl: data.background_image ?? firstSlide.imageUrl,
          active: true,
        });
      } else {
        await storage.createHeroSlide({
          title: data.title,
          subtitle: data.subtitle ?? "",
          ctaText: data.cta_primary_text ?? "",
          ctaLink: data.cta_primary_url ?? "",
          imageUrl: data.background_image ?? "",
          active: true,
          sortOrder: 0,
        });
      }

      await storage.upsertSetting(
        "cms_landing_hero_meta",
        JSON.stringify(data),
        "json",
      );

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error saving CMS hero:", error);
      res.status(500).json({ error: "Failed to save hero" });
    }
  });

  app.post("/api/cms/sections", isAuthenticated, async (req, res) => {
    try {
      const data = cmsSectionsSchema.parse(req.body);
      await storage.upsertSetting("cms_landing_sections", JSON.stringify(data), "json");
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error saving CMS sections:", error);
      res.status(500).json({ error: "Failed to save sections" });
    }
  });

  app.post("/api/cms/features", isAuthenticated, async (req, res) => {
    try {
      const data = cmsFeatureSchema.parse(req.body);
      const current = parseJsonValue<any[]>((await storage.getSetting("cms_landing_features"))?.value, []);
      const created = { ...data, id: getNextNumericId(current) };
      const updated = [...current, created];
      await storage.upsertSetting("cms_landing_features", JSON.stringify(updated), "json");
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating CMS feature:", error);
      res.status(500).json({ error: "Failed to create feature" });
    }
  });

  app.put("/api/cms/features/:id", isAuthenticated, async (req, res) => {
    try {
      const data = cmsFeatureSchema.parse(req.body);
      const featureId = String(req.params.id);
      const current = parseJsonValue<any[]>((await storage.getSetting("cms_landing_features"))?.value, []);
      const updated = current.map((feature) =>
        String(feature.id) === featureId ? { ...feature, ...data, id: feature.id } : feature,
      );
      await storage.upsertSetting("cms_landing_features", JSON.stringify(updated), "json");
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating CMS feature:", error);
      res.status(500).json({ error: "Failed to update feature" });
    }
  });

  app.delete("/api/cms/features/:id", isAuthenticated, async (req, res) => {
    try {
      const featureId = String(req.params.id);
      const current = parseJsonValue<any[]>((await storage.getSetting("cms_landing_features"))?.value, []);
      const updated = current.filter((feature) => String(feature.id) !== featureId);
      await storage.upsertSetting("cms_landing_features", JSON.stringify(updated), "json");
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CMS feature:", error);
      res.status(500).json({ error: "Failed to delete feature" });
    }
  });

  app.post("/api/cms/testimonials", isAuthenticated, async (req, res) => {
    try {
      const data = cmsTestimonialSchema.parse(req.body);
      const created = await storage.createReview({
        name: data.name,
        content: data.quote,
        eventType: data.role,
        photo: data.avatar_url ?? "",
        rating: 5,
        featured: false,
        published: data.is_active,
        eventDate: "",
      });
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating CMS testimonial:", error);
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  });

  app.put("/api/cms/testimonials/:id", isAuthenticated, async (req, res) => {
    try {
      const data = cmsTestimonialSchema.parse(req.body);
      const updated = await storage.updateReview(String(req.params.id), {
        name: data.name,
        content: data.quote,
        eventType: data.role,
        photo: data.avatar_url ?? "",
        published: data.is_active,
      });
      if (!updated) {
        return res.status(404).json({ error: "Testimonial not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating CMS testimonial:", error);
      res.status(500).json({ error: "Failed to update testimonial" });
    }
  });

  app.delete("/api/cms/testimonials/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteReview(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CMS testimonial:", error);
      res.status(500).json({ error: "Failed to delete testimonial" });
    }
  });

  app.post("/api/cms/partners", isAuthenticated, async (req, res) => {
    try {
      const data = cmsPartnerSchema.parse(req.body);
      const current = parseJsonValue<any[]>((await storage.getSetting("cms_landing_partners"))?.value, []);
      const created = { ...data, id: getNextNumericId(current) };
      const updated = [...current, created];
      await storage.upsertSetting("cms_landing_partners", JSON.stringify(updated), "json");
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating CMS partner:", error);
      res.status(500).json({ error: "Failed to create partner" });
    }
  });

  app.put("/api/cms/partners/:id", isAuthenticated, async (req, res) => {
    try {
      const data = cmsPartnerSchema.parse(req.body);
      const partnerId = String(req.params.id);
      const current = parseJsonValue<any[]>((await storage.getSetting("cms_landing_partners"))?.value, []);
      const updated = current.map((partner) =>
        String(partner.id) === partnerId ? { ...partner, ...data, id: partner.id } : partner,
      );
      await storage.upsertSetting("cms_landing_partners", JSON.stringify(updated), "json");
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating CMS partner:", error);
      res.status(500).json({ error: "Failed to update partner" });
    }
  });

  app.delete("/api/cms/partners/:id", isAuthenticated, async (req, res) => {
    try {
      const partnerId = String(req.params.id);
      const current = parseJsonValue<any[]>((await storage.getSetting("cms_landing_partners"))?.value, []);
      const updated = current.filter((partner) => String(partner.id) !== partnerId);
      await storage.upsertSetting("cms_landing_partners", JSON.stringify(updated), "json");
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CMS partner:", error);
      res.status(500).json({ error: "Failed to delete partner" });
    }
  });

  app.post("/api/cms/publish", isAuthenticated, async (_req, res) => {
    try {
      await storage.upsertSetting("cms_landing_publish_status", "published", "text");
      const publishedAt = new Date().toISOString();
      await storage.upsertSetting("cms_landing_published_at", publishedAt, "text");

      const landingPayload = await buildCmsLandingPayload();
      const currentVersions = parseJsonValue<Array<Record<string, any>>>(
        (await storage.getSetting("cms_landing_versions"))?.value,
        [],
      );
      const nextVersionNumber = (currentVersions[0]?.version ?? 0) + 1;
      const nextVersion = {
        id: randomUUID(),
        type: "landing",
        version: nextVersionNumber,
        created_at: publishedAt,
        snapshot: landingPayload,
      };

      await storage.upsertSetting(
        "cms_landing_versions",
        JSON.stringify([nextVersion, ...currentVersions].slice(0, 50)),
        "json",
      );
      await appendCmsActivity({
        action: "publish",
        resourceType: "landing_page",
        resourceName: `Landing page v${nextVersionNumber}`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error publishing CMS changes:", error);
      res.status(500).json({ error: "Failed to publish" });
    }
  });

  app.get("/api/cms/content-types", isAuthenticated, async (_req, res) => {
    try {
      const [contentTypes, fields] = await Promise.all([getCmsContentTypes(), getCmsContentFields()]);
      const mapped = contentTypes.map((contentType) => ({
        ...contentType,
        field_count: fields.filter((field) => String(field.content_type_id) === String(contentType.id)).length,
        entry_count: 0,
      }));
      res.json(mapped);
    } catch (error) {
      console.error("Error fetching CMS content types:", error);
      res.status(500).json({ error: "Failed to fetch content types" });
    }
  });

  app.get("/api/cms/content-types/:id", isAuthenticated, async (req, res) => {
    try {
      const contentTypeId = String(req.params.id);
      const [contentTypes, fields] = await Promise.all([getCmsContentTypes(), getCmsContentFields()]);
      const contentType = contentTypes.find((entry) => String(entry.id) === contentTypeId);

      if (!contentType) {
        return res.status(404).json({ error: "Content type not found" });
      }

      const contentTypeFields = fields
        .filter((field) => String(field.content_type_id) === contentTypeId)
        .sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0));

      res.json({ ...contentType, fields: contentTypeFields });
    } catch (error) {
      console.error("Error fetching CMS content type details:", error);
      res.status(500).json({ error: "Failed to fetch content type details" });
    }
  });

  app.post("/api/cms/content-types", isAuthenticated, async (req, res) => {
    try {
      const data = cmsContentTypeSchema.parse(req.body);
      const contentTypes = await getCmsContentTypes();
      const created = {
        ...data,
        id: data.id ?? randomUUID(),
        description: data.description ?? null,
        icon: data.icon ?? null,
        color: data.color ?? null,
        is_system: data.is_system ?? false,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
      };

      await saveCmsContentTypes([...contentTypes, created]);
      await appendCmsActivity({
        action: "create",
        resourceType: "content_type",
        resourceId: String(created.id),
        resourceName: created.name,
      });

      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating CMS content type:", error);
      res.status(500).json({ error: "Failed to create content type" });
    }
  });

  app.delete("/api/cms/content-types/:id", isAuthenticated, async (req, res) => {
    try {
      const contentTypeId = String(req.params.id);
      const [contentTypes, fields] = await Promise.all([getCmsContentTypes(), getCmsContentFields()]);
      const contentType = contentTypes.find((entry) => String(entry.id) === contentTypeId);

      if (!contentType) {
        return res.status(404).json({ error: "Content type not found" });
      }

      const nextContentTypes = contentTypes.filter((entry) => String(entry.id) !== contentTypeId);
      const nextFields = fields.filter((field) => String(field.content_type_id) !== contentTypeId);
      await Promise.all([saveCmsContentTypes(nextContentTypes), saveCmsContentFields(nextFields)]);

      await appendCmsActivity({
        action: "delete",
        resourceType: "content_type",
        resourceId: String(contentType.id),
        resourceName: String(contentType.name ?? "content-type"),
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CMS content type:", error);
      res.status(500).json({ error: "Failed to delete content type" });
    }
  });

  app.post("/api/cms/content-types/:id/fields", isAuthenticated, async (req, res) => {
    try {
      const contentTypeId = String(req.params.id);
      const data = cmsContentFieldSchema.parse(req.body);
      const [contentTypes, fields] = await Promise.all([getCmsContentTypes(), getCmsContentFields()]);
      const contentType = contentTypes.find((entry) => String(entry.id) === contentTypeId);

      if (!contentType) {
        return res.status(404).json({ error: "Content type not found" });
      }

      const created = {
        ...data,
        id: data.id ?? randomUUID(),
        content_type_id: contentTypeId,
        required: data.required ?? false,
        options: data.options ?? [],
        validation_rules: data.validation_rules ?? {},
        display_order: data.display_order ?? fields.filter((field) => String(field.content_type_id) === contentTypeId).length,
      };

      await saveCmsContentFields([...fields, created]);
      await appendCmsActivity({
        action: "create",
        resourceType: "field",
        resourceId: String(created.id),
        resourceName: `${created.label} (${contentType.name})`,
      });

      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating CMS field:", error);
      res.status(500).json({ error: "Failed to create content field" });
    }
  });

  app.delete("/api/cms/content-fields/:fieldId", isAuthenticated, async (req, res) => {
    try {
      const fieldId = String(req.params.fieldId);
      const [fields, contentTypes] = await Promise.all([getCmsContentFields(), getCmsContentTypes()]);
      const field = fields.find((entry) => String(entry.id) === fieldId);

      if (!field) {
        return res.status(404).json({ error: "Content field not found" });
      }

      const contentType = contentTypes.find(
        (entry) => String(entry.id) === String(field.content_type_id),
      );
      const nextFields = fields.filter((entry) => String(entry.id) !== fieldId);

      await saveCmsContentFields(nextFields);
      await appendCmsActivity({
        action: "delete",
        resourceType: "field",
        resourceId: String(field.id),
        resourceName: `${String(field.label ?? "field")}${contentType ? ` (${String(contentType.name)})` : ""}`,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CMS field:", error);
      res.status(500).json({ error: "Failed to delete content field" });
    }
  });

  app.get("/api/cms/media", isAuthenticated, async (_req, res) => {
    try {
      const mediaItems = await storage.getMedia();
      const mapped = mediaItems.map((item) => ({
        id: item.id,
        filename: item.title || "media-item",
        original_name: item.title || "media-item",
        mime_type: item.type === "video" ? "video/mp4" : "image/jpeg",
        size: 0,
        url: item.url,
        folder_id: null,
        created_at: item.createdAt,
      }));
      res.json(mapped);
    } catch (error) {
      console.error("Error fetching CMS media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  app.post("/api/cms/media", isAuthenticated, (req, res) => {
    upload.single("file")(req, res, async (err: unknown) => {
      try {
        if (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          return res.status(400).json({ error: message });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const uploadedFile = req.file;
        const mediaType = uploadedFile.mimetype.startsWith("video/") ? "video" : "image";
        const mediaUrl = `/uploads/${uploadedFile.filename}`;
        const thumbnailUrl = mediaType === "video"
          ? await generateVideoThumbnail(uploadedFile.path, uploadedFile.filename)
          : mediaUrl;

        const created = await storage.createMedia({
          projectId: null,
          type: mediaType,
          url: mediaUrl,
          thumbnailUrl,
          title: uploadedFile.originalname,
          alt: uploadedFile.originalname,
          sortOrder: 0,
        });

        await appendCmsActivity({
          action: "create",
          resourceType: "media",
          resourceId: String(created.id),
          resourceName: uploadedFile.originalname,
        });

        return res.status(201).json({
          id: created.id,
          filename: uploadedFile.filename,
          original_name: uploadedFile.originalname,
          mime_type: uploadedFile.mimetype,
          size: uploadedFile.size,
          url: mediaUrl,
          folder_id: null,
          created_at: created.createdAt,
        });
      } catch (error) {
        console.error("Error uploading CMS media:", error);
        return res.status(500).json({ error: "Failed to upload media" });
      }
    });
  });

  app.delete("/api/cms/media/:id", isAuthenticated, async (req, res) => {
    try {
      const mediaId = String(req.params.id);
      const mediaItems = await storage.getMedia();
      const mediaItem = mediaItems.find((item) => String(item.id) === mediaId);

      if (mediaItem) {
        const candidateUrls = [mediaItem.url, mediaItem.thumbnailUrl].filter(
          (url): url is string => Boolean(url),
        );

        for (const fileUrl of candidateUrls) {
          if (!fileUrl.startsWith("/uploads/")) {
            continue;
          }

          const filePath = path.resolve(process.cwd(), fileUrl.replace(/^\//, ""));

          if (!filePath.startsWith(uploadsDir)) {
            continue;
          }

          try {
            await fs.promises.unlink(filePath);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
              console.warn("Failed deleting media file:", filePath, error);
            }
          }
        }
      }

      await storage.deleteMedia(mediaId);
      await appendCmsActivity({
        action: "delete",
        resourceType: "media",
        resourceId: mediaId,
        resourceName: mediaItem?.title || `media-${mediaId}`,
      });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CMS media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });

  app.get("/api/cms/navigation/header", isAuthenticated, async (_req, res) => {
    try {
      const payload = await buildCmsNavigationPayload();
      res.json(payload);
    } catch (error) {
      console.error("Error fetching CMS navigation:", error);
      res.status(500).json({ error: "Failed to fetch navigation" });
    }
  });

  app.put("/api/cms/navigation/header", isAuthenticated, async (req, res) => {
    try {
      const items = Array.isArray(req.body?.items) ? req.body.items : [];
      await storage.upsertSetting("cms_navigation_header", JSON.stringify(items), "json");
      await appendCmsActivity({
        action: "update",
        resourceType: "navigation",
        resourceName: "Header navigation",
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving CMS navigation:", error);
      res.status(500).json({ error: "Failed to save navigation" });
    }
  });

  app.get("/api/cms/activity-log", isAuthenticated, async (_req, res) => {
    try {
      const activity = await getCmsActivityLog();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching CMS activity log:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });

  // ==========================================
  // ADMIN API ROUTES (Protected)
  // ==========================================

  // Dashboard stats
  app.get("/api/admin/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Projects CRUD
  app.get("/api/admin/projects", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/admin/projects", isAuthenticated, async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/admin/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.updateProject(String(req.params.id), req.body);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/admin/projects/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProject(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Media CRUD
  app.get("/api/admin/media", isAuthenticated, async (req, res) => {
    try {
      const media = await storage.getMedia();
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  app.post("/api/admin/media", isAuthenticated, async (req, res) => {
    try {
      const data = insertMediaSchema.parse(req.body);
      const item = await storage.createMedia(data);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating media:", error);
      res.status(500).json({ message: "Failed to create media" });
    }
  });

  app.delete("/api/admin/media/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMedia(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Pages CRUD
  app.get("/api/admin/pages", isAuthenticated, async (req, res) => {
    try {
      const pages = await storage.getPages();
      res.json(pages);
    } catch (error) {
      console.error("Error fetching pages:", error);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  app.post("/api/admin/pages", isAuthenticated, async (req, res) => {
    try {
      const data = insertPageSchema.parse(req.body);
      const page = await storage.createPage(data);
      res.status(201).json(page);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating page:", error);
      res.status(500).json({ message: "Failed to create page" });
    }
  });

  app.patch("/api/admin/pages/:id", isAuthenticated, async (req, res) => {
    try {
      const page = await storage.updatePage(String(req.params.id), req.body);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Error updating page:", error);
      res.status(500).json({ message: "Failed to update page" });
    }
  });

  app.delete("/api/admin/pages/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePage(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  // Contacts CRUD
  app.get("/api/admin/contacts", isAuthenticated, async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });


  app.patch("/api/admin/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const contact = await storage.updateContactStatus(String(req.params.id), status);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/admin/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteContact(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Reviews CRUD
  app.get("/api/admin/reviews", isAuthenticated, async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/admin/reviews", isAuthenticated, async (req, res) => {
    try {
      const data = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.patch("/api/admin/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      const review = await storage.updateReview(String(req.params.id), req.body);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete("/api/admin/reviews/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteReview(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Hero Slides CRUD
  app.get("/api/admin/hero-slides", isAuthenticated, async (req, res) => {
    try {
      const slides = await storage.getHeroSlides();
      res.json(slides);
    } catch (error) {
      console.error("Error fetching hero slides:", error);
      res.status(500).json({ message: "Failed to fetch hero slides" });
    }
  });

  app.post("/api/admin/hero-slides", isAuthenticated, async (req, res) => {
    try {
      const data = insertHeroSlideSchema.parse(req.body);
      const slide = await storage.createHeroSlide(data);
      res.status(201).json(slide);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating hero slide:", error);
      res.status(500).json({ message: "Failed to create hero slide" });
    }
  });

  app.patch("/api/admin/hero-slides/:id", isAuthenticated, async (req, res) => {
    try {
      const slide = await storage.updateHeroSlide(String(req.params.id), req.body);
      if (!slide) {
        return res.status(404).json({ message: "Hero slide not found" });
      }
      res.json(slide);
    } catch (error) {
      console.error("Error updating hero slide:", error);
      res.status(500).json({ message: "Failed to update hero slide" });
    }
  });

  app.delete("/api/admin/hero-slides/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteHeroSlide(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hero slide:", error);
      res.status(500).json({ message: "Failed to delete hero slide" });
    }
  });

  // Settings
  app.get("/api/admin/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", isAuthenticated, async (req, res) => {
    try {
      const settingsData = req.body as Record<string, string>;
      const results = [];
      
      for (const [key, value] of Object.entries(settingsData)) {
        const setting = await storage.upsertSetting(key, value);
        results.push(setting);
      }
      
      res.json(results);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Blog CRUD
  app.get("/api/admin/blog", isAuthenticated, async (_req, res) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.post("/api/admin/blog", isAuthenticated, async (req, res) => {
    try {
      const data = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(data);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.patch("/api/admin/blog/:id", isAuthenticated, async (req, res) => {
    try {
      const post = await storage.updateBlogPost(String(req.params.id), req.body);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.delete("/api/admin/blog/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBlogPost(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Subscribers
  app.get("/api/admin/subscribers", isAuthenticated, async (_req, res) => {
    try {
      const allSubscribers = await storage.getSubscribers();
      res.json(allSubscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  });

  app.patch("/api/admin/subscribers/:id", isAuthenticated, async (req, res) => {
    try {
      const data = subscriberStatusSchema.parse(req.body);
      const subscriber = await storage.updateSubscriberStatus(String(req.params.id), data.status);
      if (!subscriber) {
        return res.status(404).json({ message: "Subscriber not found" });
      }
      res.json(subscriber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating subscriber:", error);
      res.status(500).json({ message: "Failed to update subscriber" });
    }
  });

  app.delete("/api/admin/subscribers/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSubscriber(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      res.status(500).json({ message: "Failed to delete subscriber" });
    }
  });

  // Bookings
  app.get("/api/admin/bookings", isAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const allBookings = status
        ? await storage.getBookingsByStatus(status)
        : await storage.getBookings();
      res.json(allBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch("/api/admin/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const data = bookingStatusSchema.parse(req.body);
      const booking = await storage.updateBookingStatus(String(req.params.id), data.status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/admin/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBooking(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Blocked dates
  app.get("/api/admin/blocked-dates", isAuthenticated, async (_req, res) => {
    try {
      const blocked = await storage.getBlockedDates();
      res.json(blocked);
    } catch (error) {
      console.error("Error fetching blocked dates:", error);
      res.status(500).json({ message: "Failed to fetch blocked dates" });
    }
  });

  app.post("/api/admin/blocked-dates", isAuthenticated, async (req, res) => {
    try {
      const data = insertBlockedDateSchema.parse(req.body);
      const blocked = await storage.createBlockedDate(data);
      res.status(201).json(blocked);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating blocked date:", error);
      res.status(500).json({ message: "Failed to create blocked date" });
    }
  });

  app.delete("/api/admin/blocked-dates/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBlockedDate(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blocked date:", error);
      res.status(500).json({ message: "Failed to delete blocked date" });
    }
  });

  // Client galleries (admin)
  app.get("/api/admin/galleries", isAuthenticated, async (_req, res) => {
    try {
      const galleries = await storage.getClientGalleries();
      res.json(galleries);
    } catch (error) {
      console.error("Error fetching galleries:", error);
      res.status(500).json({ message: "Failed to fetch galleries" });
    }
  });

  app.post("/api/admin/galleries", isAuthenticated, async (req, res) => {
    try {
      const data = insertClientGallerySchema.parse(req.body);
      const gallery = await storage.createClientGallery(data);
      res.status(201).json(gallery);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating gallery:", error);
      res.status(500).json({ message: "Failed to create gallery" });
    }
  });

  app.patch("/api/admin/galleries/:id", isAuthenticated, async (req, res) => {
    try {
      const gallery = await storage.updateClientGallery(String(req.params.id), req.body);
      if (!gallery) {
        return res.status(404).json({ message: "Gallery not found" });
      }
      res.json(gallery);
    } catch (error) {
      console.error("Error updating gallery:", error);
      res.status(500).json({ message: "Failed to update gallery" });
    }
  });

  app.delete("/api/admin/galleries/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteClientGallery(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting gallery:", error);
      res.status(500).json({ message: "Failed to delete gallery" });
    }
  });

  return httpServer;
}
