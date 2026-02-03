# Norwed Film - Wedding Photography & Videography Platform

## Overview

This is a full-stack wedding photography and videography portfolio website with an admin CMS. The application showcases wedding projects (photos and videos), collects customer reviews, handles contact form submissions, and provides a comprehensive admin dashboard for content management.

The platform is built with a React frontend and Express backend, using PostgreSQL for data persistence. It features Replit Auth for admin authentication and a modern, elegant design focused on the wedding industry aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Build Tool**: Vite with HMR support

The frontend follows a component-based architecture with:
- `/client/src/pages/` - Page components for public and admin routes
- `/client/src/components/public/` - Public-facing components (hero, navigation, portfolio grids)
- `/client/src/components/admin/` - Admin dashboard components
- `/client/src/components/ui/` - Reusable shadcn/ui components

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session store

Key backend patterns:
- Storage abstraction layer (`server/storage.ts`) for all database operations
- Route registration pattern in `server/routes.ts`
- Separate auth module in `server/replit_integrations/auth/`

### Database Schema
Located in `shared/schema.ts`, the schema includes:
- `projects` - Portfolio items (wedding photos/videos)
- `media` - Gallery items linked to projects
- `pages` - CMS-managed content pages
- `contacts` - Contact form submissions
- `reviews` - Customer testimonials
- `heroSlides` - Homepage slideshow content
- `siteSettings` - Global site configuration
- `sessions` - Authentication sessions (required for Replit Auth)
- `users` - User accounts (required for Replit Auth)

### Build System
- Development: Vite dev server with HMR proxied through Express
- Production: Custom build script (`script/build.ts`) using esbuild for server and Vite for client
- Database migrations: Drizzle Kit with `db:push` command

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and query building
- **connect-pg-simple**: PostgreSQL session storage

### Authentication
- **Replit Auth**: OpenID Connect authentication provider
- Required environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives
- **Embla Carousel**: Hero slideshow functionality
- **React Hook Form + Zod**: Form handling and validation
- **date-fns**: Date formatting utilities
- **Lucide React**: Icon library

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development environment indicator