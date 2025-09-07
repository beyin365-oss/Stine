# Overview

STINE is a comprehensive professional DJ live streaming platform that enables DJs to broadcast live sets to categorized audiences with advanced real-time interaction, monetization, and collaboration features. The platform combines live audio streaming capabilities with professional-grade DJ tools, social features, AI-powered analytics, stream recording, and an integrated economy system. Built as a full-stack web application, it provides both professional DJ dashboard functionality for streamers and an engaging community experience for listeners with support for multiple simultaneous audience categories and collaborative streaming sessions.

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
- **Enhanced Schema Structure**: 
  - Users table with comprehensive DJ profiles, achievements, and verification levels
  - Streams table for live broadcast sessions with recording capabilities
  - Tracks table for music library with audio analysis metadata (BPM, key, energy)
  - Chat messages and song requests for interactive features
  - Sessions table for authentication persistence
  - Subscription tiers and user subscriptions for monetization
  - Tips system for direct DJ support
  - Recordings table for stream archive and replay functionality
  - Achievements and user achievements for gamification
  - Scheduled streams for DJ calendar management
  - Notifications system for real-time updates
  - Merchandise table for DJ branded items
  - Track collaborations for multi-DJ projects
  - DJ presets for custom mixing configurations
  - Rooms system for categorized audience streaming
  - Follow relationships for social networking
- **Migration System**: Drizzle Kit for database schema migrations and management

## Real-time Features
- **WebSocket Integration**: Custom WebSocket server handling multiple concurrent connections
- **Live Chat**: Real-time messaging system with message persistence and user identification
- **Listener Tracking**: Dynamic listener count updates and stream status broadcasting
- **Song Requests**: Real-time request system with status updates (pending/accepted/declined)
- **Live Collaboration**: Real-time co-streaming and track collaboration sessions
- **Tip Notifications**: Instant tip alerts and appreciation messages
- **Achievement Unlocks**: Real-time achievement notifications and progress updates
- **Stream Recording**: Live recording status and real-time audio processing
- **Audience Categorization**: Dynamic listener grouping and targeted messaging

## AI Integration
- **OpenAI Integration**: GPT-5 powered audience analysis and categorization
- **Listener Insights**: AI analyzes chat messages to provide DJ insights about audience engagement and demographics
- **Smart Recommendations**: AI-driven suggestions for DJs based on audience behavior and preferences
- **Audience Profiling**: Intelligent categorization of listeners for targeted content
- **Performance Analytics**: AI-powered insights on track performance and optimal streaming times
- **Engagement Optimization**: Machine learning recommendations for improving audience retention
- **Content Curation**: AI-assisted track selection based on audience preferences and energy levels

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

# Recent Changes (Latest Session)

## December 2024 - Major Platform Enhancement
- **Enhanced Database Schema**: Added 15+ new tables including subscription tiers, tips system, recordings, achievements, scheduled streams, notifications, merchandise, DJ presets, and collaboration features
- **Advanced Music Upload System**: Complete audio processing pipeline with waveform generation, BPM detection, key analysis, and metadata extraction
- **Professional DJ Controls**: Implemented crossfading, 3-band EQ, effects rack (reverb, delay, filter, flanger, phaser, bitcrusher), deck controls with sync and key lock
- **Enhanced User Profiles**: Achievement system with progress tracking, social links, streaming analytics, follower system, and verification badges
- **Monetization Features**: Tip system with predefined amounts, custom messages, subscription tiers, and payment processing integration
- **Stream Recording**: Real-time recording capabilities with audio quality options, metadata management, and replay functionality
- **Advanced Analytics**: AI-powered audience insights, engagement metrics, demographic analysis, track performance, and real-time stream health monitoring
- **Social Collaboration**: Co-streaming capabilities, track collaboration projects, social feed, and notification system
- **Professional UI Enhancement**: Complete redesign with tabbed interface, advanced controls toggle, real-time metrics display, and improved user experience

## New Components Added
- `UploadManager`: Music upload with audio analysis and metadata extraction
- `AdvancedDJControls`: Professional mixing controls with effects and EQ
- `EnhancedProfile`: Achievement system and comprehensive DJ profiles
- `TipSystem` & `RecentTips`: Monetization and audience support features
- `StreamRecorder` & `RecordingLibrary`: Recording and replay functionality
- `AdvancedAnalytics`: AI-powered insights and performance metrics
- `CollaborationHub`: Social features and multi-DJ sessions
- `EnhancedLiveDashboard`: Professional streaming interface with all features integrated

## Audio & Streaming Implementation
- Real-time audio processing with Web Audio API integration
- Advanced waveform visualization and audio analysis
- Professional DJ mixing capabilities with crossfading and effects
- Stream recording with multiple quality options
- Audio metadata extraction (BPM, key, energy level detection)