# Overview

STINE is a DJ live streaming platform that enables DJs to broadcast live sets to audiences with real-time chat interaction, song requests, and analytics. The platform combines live audio streaming capabilities with social features like chat, song requests, user profiles, and AI-powered audience insights. Built as a full-stack web application, it provides both DJ dashboard functionality for streamers and an engaging experience for listeners.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA**: Built with React 18 using TypeScript and Vite for fast development and building
- **UI Framework**: Shadcn/ui components with Radix UI primitives providing accessible, customizable components
- **Styling**: Tailwind CSS with custom CSS variables for theming, featuring a dark-themed design with geometric branding elements
- **State Management**: TanStack Query for server state management and caching, with React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live chat, listener counts, and streaming updates

## Backend Architecture  
- **Node.js/Express**: REST API server with Express.js handling HTTP requests and middleware
- **WebSocket Server**: Built-in WebSocket server for real-time features like chat and live updates
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js for secure user authentication
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple for persistent login states
- **API Structure**: RESTful endpoints for user management, streaming, tracks, chat, and song requests

## Database Design
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL for scalability
- **ORM**: Drizzle ORM with type-safe database operations and schema management
- **Schema Structure**: 
  - Users table with DJ profiles and streaming status
  - Streams table for live broadcast sessions
  - Tracks table for music library management  
  - Chat messages and song requests for interactive features
  - Sessions table for authentication persistence
- **Migration System**: Drizzle Kit for database schema migrations and management

## Real-time Features
- **WebSocket Integration**: Custom WebSocket server handling multiple concurrent connections
- **Live Chat**: Real-time messaging system with message persistence and user identification
- **Listener Tracking**: Dynamic listener count updates and stream status broadcasting
- **Song Requests**: Real-time request system with status updates (pending/accepted/declined)

## AI Integration
- **OpenAI Integration**: GPT-powered audience analysis and categorization
- **Listener Insights**: AI analyzes chat messages to provide DJ insights about audience engagement and demographics
- **Smart Recommendations**: AI-driven suggestions for DJs based on audience behavior and preferences

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Replit Hosting**: Platform deployment with integrated development environment
- **OpenAI API**: GPT-4 integration for audience insights and chat analysis

## Authentication & Security
- **Replit Auth**: OpenID Connect authentication provider with user profile management
- **Session Storage**: PostgreSQL-backed session persistence for secure login state

## Frontend Libraries
- **Radix UI**: Accessible component primitives for UI elements like dialogs, dropdowns, and form controls
- **TanStack Query**: Server state management with caching, background updates, and error handling
- **Lucide React**: Icon library providing consistent iconography throughout the application
- **React Hook Form**: Form handling with validation and error management

## Development Tools
- **TypeScript**: Type safety across frontend and backend with shared schema types
- **Vite**: Fast development server and optimized production builds
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Drizzle Kit**: Database migration and schema management tooling

## Audio & Streaming (Planned)
- WebRTC for peer-to-peer audio streaming
- Media encoding libraries for audio processing
- CDN integration for stream distribution