import { db } from "./db";
import { projects, reviews, heroSlides, siteSettings } from "@shared/schema";

export async function seedDatabase() {
  try {
    // Check if we already have seed data
    const existingProjects = await db.select().from(projects).limit(1);
    if (existingProjects.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database with sample data...");

    // Seed projects
    await db.insert(projects).values([
      {
        title: "Emma & Lars",
        slug: "emma-lars",
        description: "A magical summer wedding in the heart of Oslo. Emma and Lars celebrated their love surrounded by family and friends in a beautiful outdoor ceremony followed by an elegant reception.",
        category: "wedding-photo",
        coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
        date: "June 2024",
        location: "Oslo, Norway",
        featured: true,
        published: true,
        sortOrder: 1,
      },
      {
        title: "Sofia & Henrik",
        slug: "sofia-henrik",
        description: "An intimate coastal wedding with breathtaking fjord views. Sofia and Henrik exchanged vows at sunset with the Norwegian landscape as their witness.",
        category: "wedding-video",
        coverImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
        videoUrl: "https://player.vimeo.com/video/76979871",
        date: "August 2024",
        location: "Bergen, Norway",
        featured: true,
        published: true,
        sortOrder: 2,
      },
      {
        title: "Maria & Johan",
        slug: "maria-johan",
        description: "A winter wonderland wedding under the northern lights. Maria and Johan embraced the magic of the Arctic for their unforgettable celebration.",
        category: "wedding-photo",
        coverImage: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800",
        date: "December 2024",
        location: "Tromsø, Norway",
        featured: true,
        published: true,
        sortOrder: 3,
      },
      {
        title: "Anna & Erik",
        slug: "anna-erik",
        description: "A rustic countryside celebration at a historic Norwegian farm. Anna and Erik combined tradition with modern elegance for a truly memorable day.",
        category: "wedding-video",
        coverImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800",
        videoUrl: "https://player.vimeo.com/video/76979871",
        date: "September 2024",
        location: "Lillehammer, Norway",
        featured: false,
        published: true,
        sortOrder: 4,
      },
      {
        title: "Ingrid & Thomas",
        slug: "ingrid-thomas",
        description: "A sophisticated city wedding in historic Stavanger. Ingrid and Thomas celebrated their love with style in the charming Old Town.",
        category: "wedding-photo",
        coverImage: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
        date: "July 2024",
        location: "Stavanger, Norway",
        featured: false,
        published: true,
        sortOrder: 5,
      },
    ]);

    // Seed reviews
    await db.insert(reviews).values([
      {
        name: "Emma & Lars Andersen",
        eventType: "Wedding",
        eventDate: "June 2024",
        rating: 5,
        content: "Norwed Film captured our wedding day perfectly. Every photo and every frame of video brings us back to those magical moments. Their professionalism and artistic vision exceeded all our expectations. We couldn't have asked for a better team!",
        featured: true,
        published: true,
      },
      {
        name: "Sofia & Henrik Berg",
        eventType: "Wedding",
        eventDate: "August 2024",
        rating: 5,
        content: "We couldn't be happier with our wedding film. The team was so professional and made us feel completely at ease throughout the entire day. The final result is absolutely stunning - we've watched it countless times and it still brings tears to our eyes!",
        featured: true,
        published: true,
      },
      {
        name: "Maria & Johan Nilsen",
        eventType: "Wedding",
        eventDate: "December 2024",
        rating: 5,
        content: "From the first meeting to receiving our final gallery, the experience was incredible. They captured not just images, but the emotions and atmosphere of our special day. Our winter wedding photos are like works of art.",
        featured: true,
        published: true,
      },
      {
        name: "Anna & Erik Olsen",
        eventType: "Wedding",
        eventDate: "September 2024",
        rating: 5,
        content: "The attention to detail was remarkable. They understood our vision perfectly and delivered beyond what we imagined. Our wedding video makes us feel like we're reliving the day every time we watch it.",
        featured: false,
        published: true,
      },
      {
        name: "Kristine & Magnus Hansen",
        eventType: "Wedding",
        eventDate: "May 2024",
        rating: 5,
        content: "Professional, creative, and incredibly kind. The team made our wedding day stress-free when it came to photography. The results speak for themselves - absolutely breathtaking images that tell our story beautifully.",
        featured: false,
        published: true,
      },
    ]);

    // Seed hero slides
    await db.insert(heroSlides).values([
      {
        imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920",
        title: "Love Stories",
        subtitle: "Elegantly Told",
        ctaText: "Book Us",
        ctaLink: "/contact",
        sortOrder: 1,
        active: true,
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1920",
        title: "Timeless Moments",
        subtitle: "Beautifully Captured",
        ctaText: "View Portfolio",
        ctaLink: "/portfolio/wedding-photo",
        sortOrder: 2,
        active: true,
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=1920",
        title: "Your Wedding",
        subtitle: "Our Passion",
        ctaText: "Contact Us",
        ctaLink: "/contact",
        sortOrder: 3,
        active: true,
      },
    ]);

    // Seed settings
    await db.insert(siteSettings).values([
      { key: "siteName", value: "Norwed Film", type: "text" },
      { key: "siteTagline", value: "Love stories elegantly told", type: "text" },
      { key: "contactEmail", value: "hello@norwedfilm.no", type: "text" },
      { key: "contactPhone", value: "+47 123 45 678", type: "text" },
      { key: "address", value: "Oslo, Norway", type: "text" },
      { key: "instagramUrl", value: "https://instagram.com/norwedfilm", type: "text" },
    ]);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
