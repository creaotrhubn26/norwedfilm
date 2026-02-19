import type { Express, RequestHandler } from "express";
import { pool } from "./db";
import { cancelCrawl, findDuplicatePages, getCrawlProgress, getCrawlSummary, runCrawlJob } from "./crawler-engine";

type SeoImpact = "high" | "medium" | "low";

interface SeoAction {
  key: string;
  title: string;
  impact: SeoImpact;
  count: number;
  description: string;
  action: string;
  examples: string[];
}

function parseCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function scoreSeoHealth(totalPages: number, actions: SeoAction[]): number {
  if (totalPages <= 0) return 0;

  const weightedIssues = actions.reduce((sum, action) => {
    const weight = action.impact === "high" ? 3 : action.impact === "medium" ? 2 : 1;
    return sum + action.count * weight;
  }, 0);

  const normalizedPenalty = Math.min(1, weightedIssues / Math.max(1, totalPages * 6));
  return Math.max(1, Math.round(100 - normalizedPenalty * 100));
}

async function ensureCrawlerTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS crawler_jobs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Untitled Crawl',
      target_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      crawl_type TEXT NOT NULL DEFAULT 'full',
      max_pages INTEGER NOT NULL DEFAULT 500,
      max_depth INTEGER NOT NULL DEFAULT 10,
      crawl_delay_ms INTEGER NOT NULL DEFAULT 200,
      respect_robots_txt BOOLEAN NOT NULL DEFAULT true,
      follow_external_links BOOLEAN NOT NULL DEFAULT false,
      follow_subdomains BOOLEAN NOT NULL DEFAULT false,
      include_images BOOLEAN NOT NULL DEFAULT true,
      include_css BOOLEAN NOT NULL DEFAULT false,
      include_js BOOLEAN NOT NULL DEFAULT false,
      check_canonical BOOLEAN NOT NULL DEFAULT true,
      check_hreflang BOOLEAN NOT NULL DEFAULT true,
      extract_structured_data BOOLEAN NOT NULL DEFAULT true,
      check_accessibility BOOLEAN NOT NULL DEFAULT false,
      custom_user_agent TEXT,
      custom_robots_txt TEXT,
      url_list TEXT[],
      include_patterns TEXT[],
      exclude_patterns TEXT[],
      custom_extraction JSONB,
      pages_crawled INTEGER NOT NULL DEFAULT 0,
      pages_total INTEGER NOT NULL DEFAULT 0,
      errors_count INTEGER NOT NULL DEFAULT 0,
      warnings_count INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      duration_ms INTEGER,
      schedule_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crawler_results (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES crawler_jobs(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      url_hash TEXT NOT NULL,
      parent_url TEXT,
      depth INTEGER NOT NULL DEFAULT 0,
      status_code INTEGER,
      content_type TEXT,
      response_time_ms INTEGER,
      content_size INTEGER,
      content_hash TEXT,
      redirect_url TEXT,
      redirect_chain TEXT[],
      redirect_type TEXT,
      title TEXT,
      title_length INTEGER,
      meta_description TEXT,
      meta_description_length INTEGER,
      meta_keywords TEXT,
      canonical_url TEXT,
      canonical_is_self BOOLEAN,
      h1 TEXT[],
      h1_count INTEGER DEFAULT 0,
      h2 TEXT[],
      h2_count INTEGER DEFAULT 0,
      robots_meta TEXT,
      robots_txt_allowed BOOLEAN DEFAULT true,
      x_robots_tag TEXT,
      internal_links_count INTEGER DEFAULT 0,
      external_links_count INTEGER DEFAULT 0,
      broken_links TEXT[],
      images_count INTEGER DEFAULT 0,
      images_without_alt INTEGER DEFAULT 0,
      images_alt_text JSONB,
      hreflang JSONB,
      hreflang_errors TEXT[],
      structured_data JSONB,
      structured_data_errors TEXT[],
      og_tags JSONB,
      twitter_tags JSONB,
      word_count INTEGER,
      text_ratio REAL,
      custom_data JSONB,
      accessibility_issues JSONB,
      issues JSONB,
      indexable BOOLEAN DEFAULT true,
      indexability_reason TEXT,
      crawled_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crawler_schedules (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      target_url TEXT NOT NULL,
      cron_expression TEXT NOT NULL DEFAULT '0 3 * * 1',
      is_active BOOLEAN NOT NULL DEFAULT true,
      max_pages INTEGER NOT NULL DEFAULT 500,
      max_depth INTEGER NOT NULL DEFAULT 10,
      crawl_delay_ms INTEGER NOT NULL DEFAULT 200,
      respect_robots_txt BOOLEAN NOT NULL DEFAULT true,
      follow_external_links BOOLEAN NOT NULL DEFAULT false,
      last_run_at TIMESTAMP,
      next_run_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_crawler_results_job_id ON crawler_results(job_id);
    CREATE INDEX IF NOT EXISTS idx_crawler_results_url_hash ON crawler_results(url_hash);
    CREATE INDEX IF NOT EXISTS idx_crawler_results_status_code ON crawler_results(job_id, status_code);
    CREATE INDEX IF NOT EXISTS idx_crawler_results_content_hash ON crawler_results(job_id, content_hash);
  `);
}

export async function registerCrawlerRoutes(app: Express, authMiddleware: RequestHandler) {
  await ensureCrawlerTables();

  app.get("/api/cms/crawler/jobs", authMiddleware, async (_req, res) => {
    try {
      const result = await pool.query("SELECT * FROM crawler_jobs ORDER BY created_at DESC LIMIT 50");
      res.json(result.rows);
    } catch (error) {
      console.error("Error listing crawler jobs:", error);
      res.status(500).json({ error: "Failed to list crawler jobs" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id", authMiddleware, async (req, res) => {
    try {
      const id = String(req.params.id);
      const job = await pool.query("SELECT * FROM crawler_jobs WHERE id = $1", [id]);
      if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

      const summary = await getCrawlSummary(parseInt(id, 10));
      res.json({ ...job.rows[0], summary });
    } catch (error) {
      console.error("Error fetching crawler job:", error);
      res.status(500).json({ error: "Failed to fetch crawler job" });
    }
  });

  app.post("/api/cms/crawler/jobs", authMiddleware, async (req, res) => {
    try {
      const {
        name,
        target_url,
        crawl_type = "full",
        max_pages = 500,
        max_depth = 10,
        crawl_delay_ms = 200,
        respect_robots_txt = true,
        follow_external_links = false,
        follow_subdomains = false,
        include_images = true,
        include_css = false,
        include_js = false,
        check_canonical = true,
        check_hreflang = true,
        extract_structured_data = true,
        check_accessibility = true,
        custom_user_agent,
        custom_robots_txt,
        url_list,
        include_patterns,
        exclude_patterns,
        custom_extraction,
      } = req.body;

      if (!target_url) {
        return res.status(400).json({ error: "target_url is required" });
      }

      try {
        new URL(target_url);
      } catch {
        return res.status(400).json({ error: "Invalid target_url" });
      }

      const result = await pool.query(
        `INSERT INTO crawler_jobs (
          name, target_url, crawl_type, max_pages, max_depth, crawl_delay_ms,
          respect_robots_txt, follow_external_links, follow_subdomains,
          include_images, include_css, include_js,
          check_canonical, check_hreflang, extract_structured_data, check_accessibility,
          custom_user_agent, custom_robots_txt,
          url_list, include_patterns, exclude_patterns, custom_extraction, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'pending')
        RETURNING *`,
        [
          name || `Crawl ${target_url}`,
          target_url,
          crawl_type,
          max_pages,
          max_depth,
          crawl_delay_ms,
          respect_robots_txt,
          follow_external_links,
          follow_subdomains,
          include_images,
          include_css,
          include_js,
          check_canonical,
          check_hreflang,
          extract_structured_data,
          check_accessibility,
          custom_user_agent || null,
          custom_robots_txt || null,
          url_list || null,
          include_patterns || null,
          exclude_patterns || null,
          custom_extraction ? JSON.stringify(custom_extraction) : null,
        ],
      );

      const job = result.rows[0];

      void runCrawlJob({
        jobId: job.id,
        targetUrl: target_url,
        maxPages: max_pages,
        maxDepth: max_depth,
        crawlDelayMs: crawl_delay_ms,
        respectRobotsTxt: respect_robots_txt,
        followExternalLinks: follow_external_links,
        followSubdomains: follow_subdomains,
        includeImages: include_images,
        includeCss: include_css,
        includeJs: include_js,
        checkCanonical: check_canonical,
        checkHreflang: check_hreflang,
        extractStructuredData: extract_structured_data,
        checkAccessibility: check_accessibility,
        customUserAgent: custom_user_agent,
        customRobotsTxt: custom_robots_txt,
        urlList: url_list,
        includePatterns: include_patterns,
        excludePatterns: exclude_patterns,
        customExtraction: custom_extraction,
      }).catch((error) => {
        console.error("Crawler background job error:", error);
      });

      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating crawler job:", error);
      res.status(500).json({ error: "Failed to create crawler job" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id/results", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
      const offset = (page - 1) * limit;

      const totalResult = await pool.query("SELECT COUNT(*) as c FROM crawler_results WHERE job_id = $1", [id]);
      const total = parseInt(totalResult.rows[0].c, 10);
      const rows = await pool.query(
        "SELECT * FROM crawler_results WHERE job_id = $1 ORDER BY url ASC LIMIT $2 OFFSET $3",
        [id, limit, offset],
      );

      res.json({
        results: rows.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error("Error fetching crawler results:", error);
      res.status(500).json({ error: "Failed to fetch crawler results" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id/issues", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `SELECT issue->>'type' as issue_type, issue->>'severity' as severity, COUNT(*) as count, array_agg(DISTINCT url) as example_urls
         FROM crawler_results, jsonb_array_elements(issues) as issue
         WHERE job_id = $1
         GROUP BY issue->>'type', issue->>'severity'`,
        [id],
      );
      res.json(result.rows.map((row) => ({ ...row, count: parseInt(row.count, 10) })));
    } catch (error) {
      console.error("Error fetching crawler issues:", error);
      res.status(500).json({ error: "Failed to fetch crawler issues" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id/seo-insights", authMiddleware, async (req, res) => {
    try {
      const jobId = parseInt(String(req.params.id), 10);
      if (!Number.isFinite(jobId)) {
        return res.status(400).json({ error: "Invalid job id" });
      }

      const jobResult = await pool.query("SELECT id, target_url, status FROM crawler_jobs WHERE id = $1", [jobId]);
      if (jobResult.rows.length === 0) {
        return res.status(404).json({ error: "Job not found" });
      }

      const overviewResult = await pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE content_type ILIKE '%text/html%') AS total_html_pages,
          COUNT(*) FILTER (WHERE status_code >= 400 OR status_code = 0) AS error_pages,
          COUNT(*) FILTER (WHERE NOT indexable) AS non_indexable_pages,
          COUNT(*) FILTER (WHERE response_time_ms > 2000) AS slow_pages,
          COUNT(*) FILTER (WHERE COALESCE(title, '') = '') AS missing_title_pages,
          COUNT(*) FILTER (WHERE COALESCE(meta_description, '') = '') AS missing_meta_description_pages,
          COUNT(*) FILTER (WHERE COALESCE(h1_count, 0) = 0) AS missing_h1_pages,
          COUNT(*) FILTER (WHERE COALESCE(canonical_url, '') = '') AS missing_canonical_pages,
          COUNT(*) FILTER (WHERE COALESCE(word_count, 0) > 0 AND word_count < 300) AS thin_content_pages,
          COUNT(*) FILTER (WHERE COALESCE(images_without_alt, 0) > 0) AS pages_with_images_missing_alt,
          COALESCE(SUM(COALESCE(images_without_alt, 0)), 0) AS images_missing_alt_total,
          COUNT(*) FILTER (WHERE COALESCE(og_tags->>'og:title', '') = '') AS missing_og_title_pages,
          COUNT(*) FILTER (WHERE COALESCE(og_tags->>'og:description', '') = '') AS missing_og_description_pages,
          COUNT(*) FILTER (WHERE COALESCE(og_tags->>'og:image', '') = '') AS missing_og_image_pages
         FROM crawler_results
         WHERE job_id = $1`,
        [jobId],
      );

      const overview = overviewResult.rows[0] || {};

      const getExampleUrls = async (whereClause: string, params: unknown[] = []) => {
        const result = await pool.query(
          `SELECT url FROM crawler_results WHERE job_id = $1 AND ${whereClause} ORDER BY url ASC LIMIT 5`,
          [jobId, ...params],
        );
        return result.rows.map((row) => String(row.url));
      };

      const actions: SeoAction[] = [];

      const missingTitlePages = parseCount(overview.missing_title_pages);
      if (missingTitlePages > 0) {
        actions.push({
          key: "missing_titles",
          title: "Mangler sidetittel",
          impact: "high",
          count: missingTitlePages,
          description: "Sider uten <title> får svakere synlighet og lavere CTR i søkeresultater.",
          action: "Legg inn unik tittel per side (ca. 50–60 tegn) med primært søkeord først.",
          examples: await getExampleUrls("COALESCE(title, '') = ''"),
        });
      }

      const missingMetaDescriptionPages = parseCount(overview.missing_meta_description_pages);
      if (missingMetaDescriptionPages > 0) {
        actions.push({
          key: "missing_meta_descriptions",
          title: "Mangler meta-beskrivelse",
          impact: "high",
          count: missingMetaDescriptionPages,
          description: "Meta-beskrivelse påvirker ikke rangering direkte, men påvirker klikkrate betydelig.",
          action: "Legg inn unik meta-beskrivelse (ca. 120–155 tegn) med tydelig verdi og CTA.",
          examples: await getExampleUrls("COALESCE(meta_description, '') = ''"),
        });
      }

      const errorPages = parseCount(overview.error_pages);
      if (errorPages > 0) {
        actions.push({
          key: "error_pages",
          title: "Sider med 4xx/5xx-feil",
          impact: "high",
          count: errorPages,
          description: "Feilsider reduserer crawl-kvalitet, brukeropplevelse og kan svekke rangering.",
          action: "Fiks brutte URL-er, opprett riktige redirects og fjern interne lenker til feilsider.",
          examples: await getExampleUrls("status_code >= 400 OR status_code = 0"),
        });
      }

      const nonIndexablePages = parseCount(overview.non_indexable_pages);
      if (nonIndexablePages > 0) {
        actions.push({
          key: "non_indexable",
          title: "Ikke-indekserbare sider",
          impact: "high",
          count: nonIndexablePages,
          description: "Sider som ikke kan indekseres kan ikke rangere i Google.",
          action: "Verifiser robots/noindex/canonical for viktige landingssider og fjern utilsiktede blokkeringer.",
          examples: await getExampleUrls("NOT indexable"),
        });
      }

      const missingH1Pages = parseCount(overview.missing_h1_pages);
      if (missingH1Pages > 0) {
        actions.push({
          key: "missing_h1",
          title: "Mangler H1",
          impact: "medium",
          count: missingH1Pages,
          description: "H1 hjelper søkemotorer å forstå sidens hovedtema.",
          action: "Legg til én tydelig H1 per side som matcher søkeintensjonen.",
          examples: await getExampleUrls("COALESCE(h1_count, 0) = 0"),
        });
      }

      const thinContentPages = parseCount(overview.thin_content_pages);
      if (thinContentPages > 0) {
        actions.push({
          key: "thin_content",
          title: "Tynt innhold",
          impact: "medium",
          count: thinContentPages,
          description: "Sider med lite innhold kan få svak tematisk relevans.",
          action: "Utvid med konkret innhold: tjenester, lokasjon, FAQ, priser/prosess og interne lenker.",
          examples: await getExampleUrls("COALESCE(word_count, 0) > 0 AND word_count < 300"),
        });
      }

      const slowPages = parseCount(overview.slow_pages);
      if (slowPages > 0) {
        actions.push({
          key: "slow_pages",
          title: "Trege sider",
          impact: "medium",
          count: slowPages,
          description: "Sakte sider kan påvirke både Core Web Vitals og konvertering negativt.",
          action: "Optimaliser bilder/video, reduser tung JS og prioriter innhold over folden.",
          examples: await getExampleUrls("response_time_ms > 2000"),
        });
      }

      const missingCanonicalPages = parseCount(overview.missing_canonical_pages);
      if (missingCanonicalPages > 0) {
        actions.push({
          key: "missing_canonical",
          title: "Mangler canonical",
          impact: "low",
          count: missingCanonicalPages,
          description: "Canonical hjelper søkemotorer å forstå foretrukket URL ved duplisert/likt innhold.",
          action: "Legg self-referencing canonical på viktige sider.",
          examples: await getExampleUrls("COALESCE(canonical_url, '') = ''"),
        });
      }

      const pagesWithMissingAlt = parseCount(overview.pages_with_images_missing_alt);
      if (pagesWithMissingAlt > 0) {
        actions.push({
          key: "images_missing_alt",
          title: "Bilder uten alt-tekst",
          impact: "low",
          count: pagesWithMissingAlt,
          description: "Mangler alt-tekst svekker tilgjengelighet og bildekontekst for søkemotorer.",
          action: "Legg beskrivende alt-tekst på viktige bilder, spesielt hero og portfolio-bilder.",
          examples: await getExampleUrls("COALESCE(images_without_alt, 0) > 0"),
        });
      }

      const missingOgPages = parseCount(overview.missing_og_title_pages)
        + parseCount(overview.missing_og_description_pages)
        + parseCount(overview.missing_og_image_pages);

      if (missingOgPages > 0) {
        actions.push({
          key: "missing_open_graph",
          title: "Mangler Open Graph-data",
          impact: "low",
          count: missingOgPages,
          description: "OG-tags forbedrer deling på sosiale flater og gir bedre presentasjon i lenkeforhåndsvisninger.",
          action: "Legg inn og vedlikehold og:title, og:description og og:image på sentrale sider.",
          examples: await getExampleUrls(
            "COALESCE(og_tags->>'og:title', '') = '' OR COALESCE(og_tags->>'og:description', '') = '' OR COALESCE(og_tags->>'og:image', '') = ''",
          ),
        });
      }

      const impactOrder: Record<SeoImpact, number> = { high: 0, medium: 1, low: 2 };
      actions.sort((a, b) => {
        const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
        if (impactDiff !== 0) return impactDiff;
        return b.count - a.count;
      });

      const totalPages = parseCount(overview.total_html_pages);
      const response = {
        generatedAt: new Date().toISOString(),
        job: {
          id: jobResult.rows[0].id,
          targetUrl: jobResult.rows[0].target_url,
          status: jobResult.rows[0].status,
        },
        overview: {
          totalPages,
          seoHealthScore: scoreSeoHealth(totalPages, actions),
          errorPages,
          nonIndexablePages,
          missingTitlePages,
          missingMetaDescriptionPages,
          thinContentPages,
          slowPages,
          pagesWithMissingAlt,
          imagesMissingAltTotal: parseCount(overview.images_missing_alt_total),
        },
        actions,
      };

      res.json(response);
    } catch (error) {
      console.error("Error generating SEO insights:", error);
      res.status(500).json({ error: "Failed to generate SEO insights" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id/duplicates", authMiddleware, async (req, res) => {
    try {
      const duplicates = await findDuplicatePages(parseInt(String(req.params.id), 10));
      res.json(duplicates);
    } catch (error) {
      console.error("Error fetching crawler duplicates:", error);
      res.status(500).json({ error: "Failed to fetch crawler duplicates" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id/redirects", authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT url, redirect_url, redirect_chain, redirect_type, status_code
         FROM crawler_results
         WHERE job_id = $1 AND redirect_url IS NOT NULL
         ORDER BY array_length(redirect_chain, 1) DESC NULLS LAST`,
        [req.params.id],
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching crawler redirects:", error);
      res.status(500).json({ error: "Failed to fetch crawler redirects" });
    }
  });

  app.post("/api/cms/crawler/jobs/:id/cancel", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      cancelCrawl(id);
      await pool.query("UPDATE crawler_jobs SET status = 'cancelled' WHERE id = $1 AND status = 'running'", [id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling crawler job:", error);
      res.status(500).json({ error: "Failed to cancel crawler job" });
    }
  });

  app.delete("/api/cms/crawler/jobs/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM crawler_results WHERE job_id = $1", [id]);
      await pool.query("DELETE FROM crawler_jobs WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting crawler job:", error);
      res.status(500).json({ error: "Failed to delete crawler job" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id/export", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const format = (req.query.format as string) || "csv";
      const results = await pool.query("SELECT * FROM crawler_results WHERE job_id = $1 ORDER BY url", [id]);

      if (format === "json") {
        res.setHeader("Content-Disposition", `attachment; filename=crawl-${id}-results.json`);
        return res.json(results.rows);
      }

      const headers = ["URL", "Status Code", "Title", "Meta Description", "Indexable", "Issues Count"];
      const rows = [headers.join(",")];
      for (const row of results.rows) {
        rows.push([
          `"${String(row.url || "").replace(/"/g, '""')}"`,
          row.status_code || "",
          `"${String(row.title || "").replace(/"/g, '""')}"`,
          `"${String(row.meta_description || "").replace(/"/g, '""')}"`,
          row.indexable ?? "",
          Array.isArray(row.issues) ? row.issues.length : 0,
        ].join(","));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=crawl-${id}-results.csv`);
      return res.send(rows.join("\n"));
    } catch (error) {
      console.error("Error exporting crawler results:", error);
      return res.status(500).json({ error: "Failed to export crawler results" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id/compare/:otherId", authMiddleware, async (req, res) => {
    try {
      const id = String(req.params.id);
      const otherId = String(req.params.otherId);
      const [crawl1, crawl2] = await Promise.all([
        pool.query("SELECT url, status_code, title, meta_description, word_count, response_time_ms, indexable FROM crawler_results WHERE job_id = $1", [id]),
        pool.query("SELECT url, status_code, title, meta_description, word_count, response_time_ms, indexable FROM crawler_results WHERE job_id = $1", [otherId]),
      ]);

      res.json({
        crawl1Id: parseInt(id, 10),
        crawl2Id: parseInt(otherId, 10),
        summary: {
          crawl1Pages: crawl1.rows.length,
          crawl2Pages: crawl2.rows.length,
        },
      });
    } catch (error) {
      console.error("Error comparing crawler jobs:", error);
      res.status(500).json({ error: "Failed to compare crawler jobs" });
    }
  });

  app.get("/api/cms/crawler/schedules", authMiddleware, async (_req, res) => {
    try {
      const result = await pool.query("SELECT * FROM crawler_schedules ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error) {
      console.error("Error listing crawler schedules:", error);
      res.status(500).json({ error: "Failed to list crawler schedules" });
    }
  });

  app.post("/api/cms/crawler/schedules", authMiddleware, async (req, res) => {
    try {
      const { name, target_url, cron_expression, max_pages, max_depth, crawl_delay_ms, respect_robots_txt, follow_external_links } = req.body;
      if (!target_url) return res.status(400).json({ error: "target_url required" });

      const result = await pool.query(
        `INSERT INTO crawler_schedules (name, target_url, cron_expression, max_pages, max_depth, crawl_delay_ms, respect_robots_txt, follow_external_links, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING *`,
        [
          name || `Schedule ${target_url}`,
          target_url,
          cron_expression || "0 3 * * 1",
          max_pages || 500,
          max_depth || 10,
          crawl_delay_ms || 200,
          respect_robots_txt ?? true,
          follow_external_links ?? false,
        ],
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating crawler schedule:", error);
      res.status(500).json({ error: "Failed to create crawler schedule" });
    }
  });

  app.put("/api/cms/crawler/schedules/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { is_active, cron_expression, max_pages, max_depth } = req.body;
      const result = await pool.query(
        `UPDATE crawler_schedules
         SET is_active = COALESCE($1, is_active),
             cron_expression = COALESCE($2, cron_expression),
             max_pages = COALESCE($3, max_pages),
             max_depth = COALESCE($4, max_depth),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [is_active, cron_expression, max_pages, max_depth, id],
      );

      if (result.rows.length === 0) return res.status(404).json({ error: "Schedule not found" });
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating crawler schedule:", error);
      res.status(500).json({ error: "Failed to update crawler schedule" });
    }
  });

  app.delete("/api/cms/crawler/schedules/:id", authMiddleware, async (req, res) => {
    try {
      await pool.query("DELETE FROM crawler_schedules WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting crawler schedule:", error);
      res.status(500).json({ error: "Failed to delete crawler schedule" });
    }
  });

  app.get("/api/cms/crawler/jobs/:id/progress", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const progress = getCrawlProgress(id);
      const job = await pool.query(
        "SELECT status, pages_crawled, pages_total, errors_count, warnings_count FROM crawler_jobs WHERE id = $1",
        [id],
      );
      if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

      res.json({ ...job.rows[0], liveProgress: progress || null });
    } catch (error) {
      console.error("Error fetching crawler progress:", error);
      res.status(500).json({ error: "Failed to fetch crawler progress" });
    }
  });
}
