import express, { type Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import { randomBytes, randomUUID } from "crypto";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { storage } from "./storage";
import { pool } from "./db";
import { setupAuth, registerAuthRoutes, isAuthenticated, isApiKeyAuthenticated } from "./auth";
import { registerCrawlerRoutes } from "./crawler-routes";
import {
  getSupabaseConnectionStatus,
  getSupabaseGoogleOAuthStatus,
  upsertContactToSupabase,
  deleteContactFromSupabase,
  upsertSubscriberToSupabase,
  deleteSubscriberFromSupabase,
  syncNorwedfilmDataToSupabase,
} from "./supabase";
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

async function ensureBlogCommentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_comments (
      id SERIAL PRIMARY KEY,
      post_id VARCHAR NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES blog_comments(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      author_email TEXT,
      author_url TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
    CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON blog_comments(parent_id);
  `);
}

function stripHtml(value: string | null | undefined) {
  return (value || "").replace(/<[^>]+>/g, "").trim();
}

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

const cmsExportSchema = z.object({
  format: z.enum(["react", "html", "tailwind", "json"]).default("json"),
  sections: z.array(z.any()).default([]),
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

function getGalleryAspectRatio(aspectRatio?: string): string {
  if (aspectRatio === "16:9") return "16 / 9";
  if (aspectRatio === "1:1") return "1 / 1";
  if (aspectRatio === "3:4") return "3 / 4";
  return "4 / 3";
}

function getGalleryObjectFit(imageFit?: string): string {
  return imageFit === "contain" ? "contain" : "cover";
}

function getGalleryAnimationAdvanced(content?: any) {
  return {
    durationSec: 14,
    delayStepMs: 120,
    easing: "ease-in-out",
    panScaleStart: 1.02,
    panScaleEnd: 1.12,
    panXStart: -1.5,
    panXEnd: 1.5,
    revealYOffsetPx: 14,
    revealScaleStart: 1.03,
    floatAmplitudePx: 8,
    ...(content?.imageAnimationAdvanced || {}),
  };
}

function getGalleryAnimationStyle(imageAnimation?: string, index = 0, advanced?: any): string {
  const config = {
    durationSec: 14,
    delayStepMs: 120,
    easing: "ease-in-out",
    ...advanced,
  };

  if (imageAnimation === "cinematic-pan") {
    return `tidum-cinematic-pan ${config.durationSec}s ${config.easing} ${index * config.delayStepMs}ms infinite alternate`;
  }
  if (imageAnimation === "cinematic-reveal") {
    return `tidum-cinematic-reveal ${Math.max(0.2, Number(config.durationSec) || 0.9)}s ${config.easing} ${index * config.delayStepMs}ms both`;
  }
  if (imageAnimation === "soft-float") {
    return `tidum-soft-float ${config.durationSec}s ${config.easing} ${index * config.delayStepMs}ms infinite`;
  }
  return "";
}

function getGalleryAnimationVarsReact(imageAnimation?: string, advanced?: any): string {
  const config = {
    panScaleStart: 1.02,
    panScaleEnd: 1.12,
    panXStart: -1.5,
    panXEnd: 1.5,
    revealYOffsetPx: 14,
    revealScaleStart: 1.03,
    floatAmplitudePx: 8,
    ...advanced,
  };

  if (imageAnimation === "cinematic-pan") {
    return `, ['--tidum-pan-scale-start' as any]: '${config.panScaleStart}', ['--tidum-pan-scale-end' as any]: '${config.panScaleEnd}', ['--tidum-pan-x-start' as any]: '${config.panXStart}%', ['--tidum-pan-x-end' as any]: '${config.panXEnd}%'`;
  }
  if (imageAnimation === "cinematic-reveal") {
    return `, ['--tidum-reveal-y' as any]: '${config.revealYOffsetPx}px', ['--tidum-reveal-scale-start' as any]: '${config.revealScaleStart}'`;
  }
  if (imageAnimation === "soft-float") {
    return `, ['--tidum-float-y' as any]: '${config.floatAmplitudePx}px'`;
  }
  return "";
}

function getGalleryAnimationVarsHtml(imageAnimation?: string, advanced?: any): string {
  const config = {
    panScaleStart: 1.02,
    panScaleEnd: 1.12,
    panXStart: -1.5,
    panXEnd: 1.5,
    revealYOffsetPx: 14,
    revealScaleStart: 1.03,
    floatAmplitudePx: 8,
    ...advanced,
  };

  if (imageAnimation === "cinematic-pan") {
    return `--tidum-pan-scale-start:${config.panScaleStart};--tidum-pan-scale-end:${config.panScaleEnd};--tidum-pan-x-start:${config.panXStart}%;--tidum-pan-x-end:${config.panXEnd}%;`;
  }
  if (imageAnimation === "cinematic-reveal") {
    return `--tidum-reveal-y:${config.revealYOffsetPx}px;--tidum-reveal-scale-start:${config.revealScaleStart};`;
  }
  if (imageAnimation === "soft-float") {
    return `--tidum-float-y:${config.floatAmplitudePx}px;`;
  }
  return "";
}

function generateServerExportCode(format: "react" | "html" | "tailwind" | "json", sections: any[]): string {
  if (format === "json") {
    return JSON.stringify(
      {
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        sections,
      },
      null,
      2,
    );
  }

  if (format === "html") {
    const htmlSections = sections
      .map((section: any, idx: number) => {
        const galleryHtml = section.content?.images && Array.isArray(section.content.images)
          ? `<div style="display:grid;gap:8px;grid-template-columns:repeat(${section.content.cols || 3},1fr);margin-top:16px;">\n${section.content.images
              .map((img: any, i: number) => {
                const aspectRatio = getGalleryAspectRatio(section.content?.aspectRatio);
                const objectFit = getGalleryObjectFit(section.content?.imageFit);
                const animationAdvanced = getGalleryAnimationAdvanced(section.content);
                const animationStyle = getGalleryAnimationStyle(section.content?.imageAnimation, i, animationAdvanced);
                const animationVars = getGalleryAnimationVarsHtml(section.content?.imageAnimation, animationAdvanced);
                const caption = img.caption || img.alt;
                const showCaptions = section.content?.showCaptions !== false;

                return `  <figure style="border:1px solid #E1E4E3;border-radius:12px;overflow:hidden;margin:0;">\n    <img src="${img.src || ""}" alt="${img.alt || `Galleri-bilde ${i + 1}`}" style="width:100%;aspect-ratio:${aspectRatio};object-fit:${objectFit};${objectFit === "contain" ? "background:#F8F9F7;" : ""}${animationStyle ? `animation:${animationStyle};` : ""}${animationVars}" />\n${showCaptions && caption ? `    <figcaption style="padding:8px 12px;font-size:12px;color:#6B7280;background:rgba(255,255,255,0.85);">${caption}</figcaption>\n` : ""}  </figure>`;
              })
              .join("\n")}</div>`
          : "<!-- Add your content here -->";

        return `<section class="section-${idx}">\n  <span class="badge">${section.type || "section"}</span>\n  <h2>${section.title || "Untitled"}</h2>\n  <div class="content">\n    ${galleryHtml}\n  </div>\n</section>`;
      })
      .join("\n\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Landing Page</title>
  <style>
    @keyframes tidum-cinematic-pan {
      0% { transform: scale(var(--tidum-pan-scale-start, 1.02)) translateX(var(--tidum-pan-x-start, -1.5%)); }
      100% { transform: scale(var(--tidum-pan-scale-end, 1.12)) translateX(var(--tidum-pan-x-end, 1.5%)); }
    }
    @keyframes tidum-cinematic-reveal {
      0% { opacity: 0; transform: translateY(var(--tidum-reveal-y, 14px)) scale(var(--tidum-reveal-scale-start, 1.03)); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes tidum-soft-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(calc(var(--tidum-float-y, 8px) * -1)); }
    }
  </style>
</head>
<body>
${htmlSections}
</body>
</html>`;
  }

  if (format === "tailwind") {
    const components = sections
      .map((section: any) => {
        const galleryJsx = section.content?.images && Array.isArray(section.content.images)
          ? `  <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: 'repeat(${section.content.cols || 3}, 1fr)' }}>
${section.content.images
  .map((img: any, i: number) => {
    const aspectRatio = getGalleryAspectRatio(section.content?.aspectRatio);
    const objectFit = getGalleryObjectFit(section.content?.imageFit);
    const animationAdvanced = getGalleryAnimationAdvanced(section.content);
    const animationStyle = getGalleryAnimationStyle(section.content?.imageAnimation, i, animationAdvanced);
    const animationVarStyle = getGalleryAnimationVarsReact(section.content?.imageAnimation, animationAdvanced);
    const caption = img.caption || img.alt;
    const showCaptions = section.content?.showCaptions !== false;

    return `    <figure key="${i}" className="rounded-xl border overflow-hidden">\n      <img src={${JSON.stringify(img.src || "")}} alt={${JSON.stringify(img.alt || `Galleri-bilde ${i + 1}`)}} style={{ width: '100%', aspectRatio: '${aspectRatio}', objectFit: '${objectFit}'${objectFit === "contain" ? ", background: '#F8F9F7'" : ""}${animationStyle ? `, animation: '${animationStyle}'` : ""}${animationVarStyle} }} />\n${showCaptions && caption ? `      <figcaption className="px-3 py-2 text-xs text-muted-foreground bg-white/80">{${JSON.stringify(caption)}}</figcaption>\n` : ""}    </figure>`;
  })
  .join("\n")}
  </div>`
          : "  <div className=\"content\">{/* Add your content here */}</div>";

        return `<section className=\"py-12 px-6\">\n  <span className=\"inline-block px-3 py-1 bg-gray-100 rounded text-sm\">${section.type || "section"}</span>\n  <h2 className=\"text-3xl font-bold mt-4\">${section.title || "Untitled"}</h2>\n${galleryJsx}\n</section>`;
      })
      .join("\n\n");

    return `import React from 'react';

export function LandingPage() {
  return (
    <div className="landing-page">
${components}
    </div>
  );
}`;
  }

  const reactSections = sections
    .map((section: any, idx: number) => {
      const galleryJsx = section.content?.images && Array.isArray(section.content.images)
        ? `      <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: 'repeat(${section.content.cols || 3}, 1fr)' }}>
${section.content.images
  .map((img: any, i: number) => {
    const aspectRatio = getGalleryAspectRatio(section.content?.aspectRatio);
    const objectFit = getGalleryObjectFit(section.content?.imageFit);
    const animationAdvanced = getGalleryAnimationAdvanced(section.content);
    const animationStyle = getGalleryAnimationStyle(section.content?.imageAnimation, i, animationAdvanced);
    const animationVarStyle = getGalleryAnimationVarsReact(section.content?.imageAnimation, animationAdvanced);
    const caption = img.caption || img.alt;
    const showCaptions = section.content?.showCaptions !== false;

    return `        <figure key="${i}" className="rounded-xl border overflow-hidden">\n          <img src={${JSON.stringify(img.src || "")}} alt={${JSON.stringify(img.alt || `Galleri-bilde ${i + 1}`)}} style={{ width: '100%', aspectRatio: '${aspectRatio}', objectFit: '${objectFit}'${objectFit === "contain" ? ", background: '#F8F9F7'" : ""}${animationStyle ? `, animation: '${animationStyle}'` : ""}${animationVarStyle} }} />\n${showCaptions && caption ? `          <figcaption className="px-3 py-2 text-xs text-muted-foreground bg-background/80">{${JSON.stringify(caption)}}</figcaption>\n` : ""}        </figure>`;
  })
  .join("\n")}
      </div>`
        : "      {/* Add your content here */}";

      return `function Section${idx}() {
  return (
    <section className="py-12 px-6">
      <span className="inline-block px-3 py-1 bg-gray-100 rounded text-sm">${section.type || "section"}</span>
      <h2 className="text-3xl font-bold mt-4">${section.title || "Untitled"}</h2>
${galleryJsx}
    </section>
  );
}`;
    })
    .join("\n\n");

  return `import React from 'react';

${reactSections}

export function LandingPage() {
  return (
    <main>
${sections.map((_s: any, idx: number) => `      <Section${idx} />`).join("\n")}
    </main>
  );
}`;
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

interface OptimizedUploadResult {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  originalSize: number;
  optimized: boolean;
  format: string;
  width?: number;
  height?: number;
  savings: number;
}

async function optimizeUploadedImage(file: Express.Multer.File): Promise<OptimizedUploadResult> {
  const sourcePath = file.path;
  const originalSize = file.size;
  const parsed = path.parse(file.filename);
  const optimizedFilename = `${parsed.name}.webp`;
  const optimizedPath = path.join(uploadsDir, optimizedFilename);

  try {
    const sourceMeta = await sharp(sourcePath).metadata();
    let pipeline = sharp(sourcePath).rotate();

    if ((sourceMeta.width ?? 0) > 3200) {
      pipeline = pipeline.resize({ width: 3200, withoutEnlargement: true });
    }

    await pipeline.webp({ quality: 90, effort: 6, smartSubsample: true }).toFile(optimizedPath);

    const optimizedMeta = await sharp(optimizedPath).metadata();
    const optimizedStat = await fs.promises.stat(optimizedPath);
    await fs.promises.unlink(sourcePath).catch(() => undefined);

    const savings = originalSize > 0
      ? Math.max(0, Math.round(((originalSize - optimizedStat.size) / originalSize) * 100))
      : 0;

    return {
      url: `/uploads/${optimizedFilename}`,
      filename: optimizedFilename,
      mimeType: "image/webp",
      size: optimizedStat.size,
      originalSize,
      optimized: true,
      format: "webp",
      width: optimizedMeta.width,
      height: optimizedMeta.height,
      savings,
    };
  } catch (error) {
    console.warn("Image optimization failed, using original file:", error);
    const fallbackFormat = file.mimetype.split("/")[1] || path.extname(file.originalname).replace(".", "") || "unknown";
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      mimeType: file.mimetype,
      size: originalSize,
      originalSize,
      optimized: false,
      format: fallbackFormat,
      savings: 0,
    };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  await ensureBlogCommentsTable();
  await registerCrawlerRoutes(app, isAuthenticated);

  app.get("/api/admin/auth/health", isApiKeyAuthenticated, (_req, res) => {
    res.json({
      ok: true,
      auth: "api-key",
      service: "norwedfilm",
      timestamp: new Date().toISOString(),
    });
  });

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

  // Blog (public)
  app.get("/api/blog", async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
      const offset = (page - 1) * limit;
      const q = ((req.query.q as string) || "").trim();
      const category = ((req.query.category as string) || "").trim();

      let where = "WHERE published = true";
      const params: any[] = [];

      if (q) {
        params.push(`%${q}%`);
        where += ` AND (title ILIKE $${params.length} OR excerpt ILIKE $${params.length} OR content ILIKE $${params.length})`;
      }

      if (category) {
        params.push(category);
        where += ` AND category = $${params.length}`;
      }

      const totalResult = await pool.query(`SELECT COUNT(*)::int AS c FROM blog_posts ${where}`, params);
      const total = totalResult.rows[0]?.c ?? 0;

      params.push(limit, offset);
      const postsResult = await pool.query(
        `SELECT * FROM blog_posts ${where}
         ORDER BY COALESCE(published_at, created_at) DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );

      res.json({
        posts: postsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post || !post.published) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.get("/api/blog/:slug/related", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 3, 10);
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.json([]);
      }

      const related = await pool.query(
        `SELECT * FROM blog_posts
         WHERE published = true
           AND id <> $1
           AND (category = $2 OR $2 IS NULL)
         ORDER BY COALESCE(published_at, created_at) DESC
         LIMIT $3`,
        [post.id, post.category, limit],
      );

      res.json(related.rows);
    } catch (error) {
      console.error("Error fetching related blog posts:", error);
      res.status(500).json({ message: "Failed to fetch related blog posts" });
    }
  });

  app.get("/api/blog/:slug/comments", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.json([]);
      }

      const result = await pool.query(
        `SELECT id, post_id, parent_id, author_name, author_url, content, created_at
         FROM blog_comments
         WHERE post_id = $1 AND status = 'approved'
         ORDER BY created_at ASC`,
        [post.id],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching blog comments:", error);
      res.status(500).json({ message: "Failed to fetch blog comments" });
    }
  });

  app.post("/api/blog/:slug/comments", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post || !post.published) {
        return res.status(404).json({ message: "Post not found" });
      }

      const authorName = String(req.body.author_name || "").trim();
      const content = String(req.body.content || "").trim();

      if (!authorName || !content) {
        return res.status(400).json({ message: "author_name and content are required" });
      }

      const parentId = req.body.parent_id ? Number(req.body.parent_id) : null;
      const inserted = await pool.query(
        `INSERT INTO blog_comments (post_id, parent_id, author_name, author_email, author_url, content, status, ip_address, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8)
         RETURNING id, post_id, parent_id, author_name, author_url, content, status, created_at`,
        [
          post.id,
          parentId,
          authorName,
          req.body.author_email || null,
          req.body.author_url || null,
          content,
          req.ip || null,
          req.get("user-agent") || null,
        ],
      );

      res.status(201).json(inserted.rows[0]);
    } catch (error) {
      console.error("Error creating blog comment:", error);
      res.status(500).json({ message: "Failed to create blog comment" });
    }
  });

  app.get("/feed.xml", async (req, res) => {
    try {
      const posts = await storage.getPublishedBlogPosts();
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const now = new Date().toUTCString();

      let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
      rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
      rss += '<channel>\n';
      rss += '  <title>Norwed Film Blog</title>\n';
      rss += `  <link>${baseUrl}/blog</link>\n`;
      rss += '  <description>Latest posts from Norwed Film</description>\n';
      rss += '  <language>en</language>\n';
      rss += `  <lastBuildDate>${now}</lastBuildDate>\n`;
      rss += `  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>\n`;

      for (const post of posts) {
        rss += '  <item>\n';
        rss += `    <title><![CDATA[${post.title}]]></title>\n`;
        rss += `    <link>${baseUrl}/blog/${post.slug}</link>\n`;
        rss += `    <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>\n`;
        if (post.excerpt) {
          rss += `    <description><![CDATA[${post.excerpt}]]></description>\n`;
        } else if (post.content) {
          rss += `    <description><![CDATA[${stripHtml(post.content).slice(0, 240)}]]></description>\n`;
        }
        if (post.author) {
          rss += `    <author>${post.author}</author>\n`;
        }
        if (post.publishedAt) {
          rss += `    <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>\n`;
        }
        rss += '  </item>\n';
      }

      rss += '</channel>\n</rss>';
      res.set("Content-Type", "application/rss+xml; charset=utf-8");
      res.send(rss);
    } catch (error) {
      console.error("Error generating RSS feed:", error);
      res.status(500).send("Failed to generate feed");
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

      void upsertContactToSupabase(contact).catch((error) => {
        console.error("Supabase contact sync error:", error);
      });

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

  app.post("/api/cms/export", isAuthenticated, async (req, res) => {
    try {
      const data = cmsExportSchema.parse(req.body);
      const code = generateServerExportCode(data.format, data.sections || []);
      res.json({
        success: true,
        format: data.format,
        code,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid export payload", details: error.errors });
      }
      console.error("Error generating CMS export:", error);
      res.status(500).json({ error: "Failed to generate export" });
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

        let mediaUrl = `/uploads/${uploadedFile.filename}`;
        let thumbnailUrl: string | null = null;
        let responseFilename = uploadedFile.filename;
        let responseMimeType = uploadedFile.mimetype;
        let responseSize = uploadedFile.size;

        if (mediaType === "video") {
          thumbnailUrl = await generateVideoThumbnail(uploadedFile.path, uploadedFile.filename);
        } else {
          const optimizedImage = await optimizeUploadedImage(uploadedFile);
          mediaUrl = optimizedImage.url;
          thumbnailUrl = optimizedImage.url;
          responseFilename = optimizedImage.filename;
          responseMimeType = optimizedImage.mimeType;
          responseSize = optimizedImage.size;
        }

        if (!thumbnailUrl) {
          thumbnailUrl = mediaUrl;
        }

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
          filename: responseFilename,
          original_name: uploadedFile.originalname,
          mime_type: responseMimeType,
          size: responseSize,
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

  app.post("/api/cms/upload", isAuthenticated, (req, res) => {
    upload.single("image")(req, res, async (err: unknown) => {
      try {
        if (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          return res.status(400).json({ error: message });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        if (!req.file.mimetype.startsWith("image/")) {
          return res.status(400).json({ error: "Only image files are allowed" });
        }

        const optimizedImage = await optimizeUploadedImage(req.file);

        return res.status(201).json({
          url: optimizedImage.url,
          thumbnail: optimizedImage.url,
          filename: optimizedImage.filename,
          size: optimizedImage.size,
          originalSize: optimizedImage.originalSize,
          optimized: optimizedImage.optimized,
          format: optimizedImage.format,
          width: optimizedImage.width,
          height: optimizedImage.height,
          savings: optimizedImage.savings,
        });
      } catch (error) {
        console.error("Error uploading and optimizing CMS image:", error);
        return res.status(500).json({ error: "Failed to optimize image" });
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

      void upsertContactToSupabase(contact).catch((error) => {
        console.error("Supabase contact status sync error:", error);
      });

      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/admin/contacts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteContact(String(req.params.id));

      void deleteContactFromSupabase(String(req.params.id)).catch((error) => {
        console.error("Supabase contact delete sync error:", error);
      });

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

  app.get("/api/admin/integrations/supabase/status", isAuthenticated, async (_req, res) => {
    try {
      const status = await getSupabaseConnectionStatus();
      res.json(status);
    } catch (error) {
      console.error("Error checking Supabase status:", error);
      res.status(500).json({
        connected: false,
        configured: true,
        message: "Failed to check Supabase status",
      });
    }
  });

  app.post("/api/admin/integrations/supabase/test", isAuthenticated, async (_req, res) => {
    try {
      const status = await getSupabaseConnectionStatus();
      res.json(status);
    } catch (error) {
      console.error("Error testing Supabase connection:", error);
      res.status(500).json({
        connected: false,
        configured: true,
        message: "Failed to test Supabase connection",
      });
    }
  });

  app.post("/api/admin/integrations/supabase/test-google-oauth", isAuthenticated, async (_req, res) => {
    try {
      const status = await getSupabaseGoogleOAuthStatus();
      res.json(status);
    } catch (error) {
      console.error("Error testing Supabase Google OAuth:", error);
      res.status(500).json({
        connected: false,
        configured: true,
        message: "Failed to test Supabase Google OAuth",
      });
    }
  });

  app.post("/api/admin/integrations/supabase/sync", isAuthenticated, async (_req, res) => {
    try {
      const [allContacts, allSubscribers] = await Promise.all([
        storage.getContacts(),
        storage.getSubscribers(),
      ]);

      const result = await syncNorwedfilmDataToSupabase({
        contacts: allContacts,
        subscribers: allSubscribers,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error syncing Norwedfilm data to Supabase:", error);
      res.status(500).json({
        success: false,
        message: "Failed to sync Norwedfilm data to Supabase",
      });
    }
  });

  app.get("/api/admin/api-key/status", isAuthenticated, async (_req, res) => {
    try {
      const [apiKeySetting, rotatedAtSetting, rotatedBySetting, rotatedIpSetting] = await Promise.all([
        storage.getSetting("norwedfilm_api_key"),
        storage.getSetting("norwedfilm_api_key_rotated_at"),
        storage.getSetting("norwedfilm_api_key_rotated_by"),
        storage.getSetting("norwedfilm_api_key_rotated_ip"),
      ]);

      const dbKey = apiKeySetting?.value?.trim() || null;
      const envKey = process.env.NORWEDFILM_API_KEY || process.env.X_API_KEY || null;

      res.json({
        enabled: Boolean(dbKey || envKey),
        source: dbKey ? "database" : envKey ? "environment" : "none",
        rotatedAt: rotatedAtSetting?.value || null,
        rotatedBy: rotatedBySetting?.value || null,
        rotatedIp: rotatedIpSetting?.value || null,
      });
    } catch (error) {
      console.error("Error fetching API key status:", error);
      res.status(500).json({ message: "Failed to fetch API key status" });
    }
  });

  app.post("/api/admin/api-key/rotate", isAuthenticated, async (req, res) => {
    try {
      const providedApiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
      const nextApiKey = providedApiKey.length > 0
        ? providedApiKey
        : `nwf_${randomBytes(32).toString("hex")}`;

      const actor = ((req.session as any)?.user?.email as string | undefined)
        || ((req.session as any)?.user?.id as string | undefined)
        || "api-key";
      const forwardedFor = req.headers["x-forwarded-for"];
      const forwardedIp = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : typeof forwardedFor === "string"
          ? forwardedFor.split(",")[0]?.trim()
          : undefined;
      const sourceIp = forwardedIp || req.ip || "unknown";

      if (nextApiKey.length < 32) {
        return res.status(400).json({ message: "API key must be at least 32 characters" });
      }

      const rotatedAt = new Date().toISOString();
      await Promise.all([
        storage.upsertSetting("norwedfilm_api_key", nextApiKey, "text"),
        storage.upsertSetting("norwedfilm_api_key_rotated_at", rotatedAt, "text"),
        storage.upsertSetting("norwedfilm_api_key_rotated_by", actor, "text"),
        storage.upsertSetting("norwedfilm_api_key_rotated_ip", sourceIp, "text"),
      ]);

      res.json({
        success: true,
        apiKey: nextApiKey,
        rotatedAt,
        rotatedBy: actor,
        rotatedIp: sourceIp,
      });
    } catch (error) {
      console.error("Error rotating API key:", error);
      res.status(500).json({ message: "Failed to rotate API key" });
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

  app.get("/api/cms/comments", isAuthenticated, async (req, res) => {
    try {
      const status = ((req.query.status as string) || "").trim();
      const params: any[] = [];
      let where = "";

      if (status) {
        params.push(status);
        where = `WHERE bc.status = $${params.length}`;
      }

      const result = await pool.query(
        `SELECT bc.*, bp.title as post_title, bp.slug as post_slug
         FROM blog_comments bc
         JOIN blog_posts bp ON bc.post_id = bp.id
         ${where}
         ORDER BY bc.created_at DESC`,
        params,
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching blog comments:", error);
      res.status(500).json({ message: "Failed to fetch blog comments" });
    }
  });

  app.put("/api/cms/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const status = String(req.body.status || "").trim();
      if (!status) {
        return res.status(400).json({ message: "status is required" });
      }

      const result = await pool.query(
        "UPDATE blog_comments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [status, req.params.id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating blog comment:", error);
      res.status(500).json({ message: "Failed to update blog comment" });
    }
  });

  app.delete("/api/cms/comments/:id", isAuthenticated, async (req, res) => {
    try {
      await pool.query("DELETE FROM blog_comments WHERE id = $1", [req.params.id]);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting blog comment:", error);
      res.status(500).json({ message: "Failed to delete blog comment" });
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

      void upsertSubscriberToSupabase(subscriber).catch((error) => {
        console.error("Supabase subscriber status sync error:", error);
      });

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

      void deleteSubscriberFromSupabase(String(req.params.id)).catch((error) => {
        console.error("Supabase subscriber delete sync error:", error);
      });

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
