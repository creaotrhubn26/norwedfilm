import { db } from "./db";
import { eq, desc, and, sql, ne } from "drizzle-orm";
import {
  projects,
  media,
  pages,
  contacts,
  reviews,
  siteSettings,
  heroSlides,
  blogPosts,
  subscribers,
  clientGalleries,
  bookings,
  blockedDates,
  type Project,
  type InsertProject,
  type Media,
  type InsertMedia,
  type Page,
  type InsertPage,
  type Contact,
  type InsertContact,
  type Review,
  type InsertReview,
  type SiteSetting,
  type HeroSlide,
  type InsertHeroSlide,
  type BlogPost,
  type InsertBlogPost,
  type Subscriber,
  type InsertSubscriber,
  type ClientGallery,
  type InsertClientGallery,
  type Booking,
  type InsertBooking,
  type BlockedDate,
  type InsertBlockedDate,
} from "@shared/schema";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getPublishedProjects(): Promise<Project[]>;
  getProjectsByCategory(category: string): Promise<Project[]>;
  getProjectBySlug(slug: string): Promise<Project | undefined>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  // Media
  getMedia(): Promise<Media[]>;
  getMediaByProject(projectId: string): Promise<Media[]>;
  createMedia(item: InsertMedia): Promise<Media>;
  deleteMedia(id: string): Promise<void>;

  // Pages
  getPages(): Promise<Page[]>;
  getPublishedPages(): Promise<Page[]>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: string, page: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: string): Promise<void>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContactStatus(id: string, status: string): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<void>;

  // Reviews
  getReviews(): Promise<Review[]>;
  getPublishedReviews(): Promise<Review[]>;
  getFeaturedReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<SiteSetting[]>;
  getSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSetting(key: string, value: string, type?: string): Promise<SiteSetting>;

  // Hero Slides
  getHeroSlides(): Promise<HeroSlide[]>;
  getActiveHeroSlides(): Promise<HeroSlide[]>;
  createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: string, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined>;
  deleteHeroSlide(id: string): Promise<void>;

  // Stats
  getStats(): Promise<{
    projects: number;
    media: number;
    contacts: number;
    reviews: number;
    newContacts: number;
  }>;
}

class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getPublishedProjects(): Promise<Project[]> {
    return db.select().from(projects)
      .where(eq(projects.published, true))
      .orderBy(projects.sortOrder, desc(projects.createdAt));
  }

  async getProjectsByCategory(category: string): Promise<Project[]> {
    return db.select().from(projects)
      .where(and(eq(projects.category, category), eq(projects.published, true)))
      .orderBy(projects.sortOrder, desc(projects.createdAt));
  }

  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Media
  async getMedia(): Promise<Media[]> {
    return db.select().from(media).orderBy(desc(media.createdAt));
  }

  async getMediaByProject(projectId: string): Promise<Media[]> {
    return db.select().from(media)
      .where(eq(media.projectId, projectId))
      .orderBy(media.sortOrder);
  }

  async createMedia(item: InsertMedia): Promise<Media> {
    const [created] = await db.insert(media).values(item).returning();
    return created;
  }

  async deleteMedia(id: string): Promise<void> {
    await db.delete(media).where(eq(media.id, id));
  }

  // Pages
  async getPages(): Promise<Page[]> {
    return db.select().from(pages).orderBy(pages.title);
  }

  async getPublishedPages(): Promise<Page[]> {
    return db.select().from(pages).where(eq(pages.published, true));
  }

  async getPageBySlug(slug: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug));
    return page;
  }

  async createPage(page: InsertPage): Promise<Page> {
    const [created] = await db.insert(pages).values(page).returning();
    return created;
  }

  async updatePage(id: string, page: Partial<InsertPage>): Promise<Page | undefined> {
    const [updated] = await db.update(pages)
      .set({ ...page, updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning();
    return updated;
  }

  async deletePage(id: string): Promise<void> {
    await db.delete(pages).where(eq(pages.id, id));
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [created] = await db.insert(contacts).values(contact).returning();
    return created;
  }

  async updateContactStatus(id: string, status: string): Promise<Contact | undefined> {
    const [updated] = await db.update(contacts)
      .set({ status })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // Reviews
  async getReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async getPublishedReviews(): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.published, true))
      .orderBy(desc(reviews.createdAt));
  }

  async getFeaturedReviews(): Promise<Review[]> {
    return db.select().from(reviews)
      .where(and(eq(reviews.published, true), eq(reviews.featured, true)))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async updateReview(id: string, review: Partial<InsertReview>): Promise<Review | undefined> {
    const [updated] = await db.update(reviews)
      .set(review)
      .where(eq(reviews.id, id))
      .returning();
    return updated;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  // Settings
  async getSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }

  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async upsertSetting(key: string, value: string, type: string = "text"): Promise<SiteSetting> {
    const [setting] = await db.insert(siteSettings)
      .values({ key, value, type })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  // Hero Slides
  async getHeroSlides(): Promise<HeroSlide[]> {
    return db.select().from(heroSlides).orderBy(heroSlides.sortOrder);
  }

  async getActiveHeroSlides(): Promise<HeroSlide[]> {
    return db.select().from(heroSlides)
      .where(eq(heroSlides.active, true))
      .orderBy(heroSlides.sortOrder);
  }

  async createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide> {
    const [created] = await db.insert(heroSlides).values(slide).returning();
    return created;
  }

  async updateHeroSlide(id: string, slide: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined> {
    const [updated] = await db.update(heroSlides)
      .set(slide)
      .where(eq(heroSlides.id, id))
      .returning();
    return updated;
  }

  async deleteHeroSlide(id: string): Promise<void> {
    await db.delete(heroSlides).where(eq(heroSlides.id, id));
  }

  // Stats
  async getStats() {
    const [projectCount] = await db.select({ count: sql<number>`count(*)::int` }).from(projects);
    const [mediaCount] = await db.select({ count: sql<number>`count(*)::int` }).from(media);
    const [contactCount] = await db.select({ count: sql<number>`count(*)::int` }).from(contacts);
    const [reviewCount] = await db.select({ count: sql<number>`count(*)::int` }).from(reviews);
    const [newContactCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(eq(contacts.status, "new"));
    const [blogCount] = await db.select({ count: sql<number>`count(*)::int` }).from(blogPosts);
    const [subscriberCount] = await db.select({ count: sql<number>`count(*)::int` }).from(subscribers);
    const [bookingCount] = await db.select({ count: sql<number>`count(*)::int` }).from(bookings);

    return {
      projects: projectCount?.count || 0,
      media: mediaCount?.count || 0,
      contacts: contactCount?.count || 0,
      reviews: reviewCount?.count || 0,
      newContacts: newContactCount?.count || 0,
      blogPosts: blogCount?.count || 0,
      subscribers: subscriberCount?.count || 0,
      bookings: bookingCount?.count || 0,
    };
  }

  // Blog Posts
  async getBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return db.select().from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db.insert(blogPosts).values(post).returning();
    return created;
  }

  async updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updated;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  // Subscribers
  async getSubscribers(): Promise<Subscriber[]> {
    return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  }

  async getActiveSubscribers(): Promise<Subscriber[]> {
    return db.select().from(subscribers)
      .where(eq(subscribers.status, "active"))
      .orderBy(desc(subscribers.createdAt));
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
    const [created] = await db.insert(subscribers).values(subscriber).returning();
    return created;
  }

  async updateSubscriberStatus(id: string, status: string): Promise<Subscriber | undefined> {
    const [updated] = await db.update(subscribers)
      .set({ status })
      .where(eq(subscribers.id, id))
      .returning();
    return updated;
  }

  async deleteSubscriber(id: string): Promise<void> {
    await db.delete(subscribers).where(eq(subscribers.id, id));
  }

  // Client Galleries
  async getClientGalleries(): Promise<ClientGallery[]> {
    return db.select().from(clientGalleries).orderBy(desc(clientGalleries.createdAt));
  }

  async getClientGalleryBySlug(slug: string): Promise<ClientGallery | undefined> {
    const [gallery] = await db.select().from(clientGalleries).where(eq(clientGalleries.slug, slug));
    return gallery;
  }

  async createClientGallery(gallery: InsertClientGallery): Promise<ClientGallery> {
    const [created] = await db.insert(clientGalleries).values(gallery).returning();
    return created;
  }

  async updateClientGallery(id: string, gallery: Partial<InsertClientGallery>): Promise<ClientGallery | undefined> {
    const [updated] = await db.update(clientGalleries)
      .set(gallery)
      .where(eq(clientGalleries.id, id))
      .returning();
    return updated;
  }

  async incrementGalleryViewCount(id: string): Promise<void> {
    await db.execute(sql`UPDATE client_galleries SET view_count = view_count + 1 WHERE id = ${id}`);
  }

  async deleteClientGallery(id: string): Promise<void> {
    await db.delete(clientGalleries).where(eq(clientGalleries.id, id));
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBookingsByStatus(status: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.status, status))
      .orderBy(desc(bookings.createdAt));
  }

  async getBookedDates(): Promise<string[]> {
    const result = await db.select({ date: bookings.date })
      .from(bookings)
      .where(ne(bookings.status, "cancelled"));
    return result.map(r => r.date);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  // Blocked Dates
  async getBlockedDates(): Promise<BlockedDate[]> {
    return db.select().from(blockedDates).orderBy(blockedDates.date);
  }

  async createBlockedDate(blocked: InsertBlockedDate): Promise<BlockedDate> {
    const [created] = await db.insert(blockedDates).values(blocked).returning();
    return created;
  }

  async deleteBlockedDate(id: string): Promise<void> {
    await db.delete(blockedDates).where(eq(blockedDates.id, id));
  }

  // Update sort order for items
  async updateSortOrder(table: string, items: { id: string; sortOrder: number }[]): Promise<void> {
    for (const item of items) {
      if (table === "projects") {
        await db.update(projects).set({ sortOrder: item.sortOrder }).where(eq(projects.id, item.id));
      } else if (table === "media") {
        await db.update(media).set({ sortOrder: item.sortOrder }).where(eq(media.id, item.id));
      } else if (table === "heroSlides") {
        await db.update(heroSlides).set({ sortOrder: item.sortOrder }).where(eq(heroSlides.id, item.id));
      }
    }
  }
}

export const storage = new DatabaseStorage();
