# Project Overview

## Overview

This is a full-stack web application built with React frontend and Express backend, featuring secure authentication through Replit's OAuth system. The application uses a modern tech stack with TypeScript, Drizzle ORM for database operations, and shadcn/ui for the user interface components. The project implements a complete authentication flow with user management, session handling, and a responsive UI built with Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit OAuth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store using connect-pg-simple
- **API Design**: RESTful API endpoints with JSON communication

### Database Design
- **Users Table**: Stores user profile information (id, email, firstName, lastName, profileImageUrl, timestamps)
- **Sessions Table**: Manages user authentication sessions with automatic expiration
- **Schema Management**: Drizzle migrations for version-controlled database changes

### Authentication Flow
- **OAuth Provider**: Replit's OpenID Connect implementation
- **Session Storage**: Server-side sessions stored in PostgreSQL
- **User Management**: Automatic user creation/update on login
- **Route Protection**: Middleware-based authentication checks for protected routes

### Development Environment
- **Hot Reload**: Vite development server with HMR for frontend
- **TypeScript**: Strict type checking across the entire codebase
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)
- **Error Handling**: Runtime error overlay for development debugging

## External Dependencies

### Database & Storage
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **connect-pg-simple**: PostgreSQL session store for Express

### Authentication & Security
- **Replit OAuth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware for Express
- **express-session**: Session management with secure cookie configuration

### UI & Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library with customizable themes

### Development & Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **PostCSS**: CSS processing with Tailwind CSS integration
- **ESBuild**: Fast JavaScript bundler for production builds

### Data Fetching & Validation
- **TanStack React Query**: Server state management and caching
- **Zod**: Runtime type validation and schema parsing
- **React Hook Form**: Form handling with validation support