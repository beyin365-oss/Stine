# STINE DJ Streaming Platform - Design Guidelines

## Design Approach

**Reference-Based Strategy**: Drawing from Twitch's streaming interface, Spotify's premium dark aesthetic, and Beatport's DJ-focused design language. Emphasis on immersive streaming experience with geometric, futuristic elements.

## Typography System

**Primary**: Inter or DM Sans (clean, modern sans-serif)
**Display/Headers**: Bebas Neue or Montserrat (bold, impactful)
**Monospace**: JetBrains Mono (for stats, timers, metadata)

**Hierarchy**:
- Hero Headlines: 72px/64px bold
- Section Headers: 48px/36px bold
- Stream Titles: 24px medium
- Body/Chat: 16px regular
- Metadata/Stats: 14px/12px monospace

## Layout System

**Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16, 24 - geometric precision throughout

**Grid Structure**: 12-column responsive grid with geometric overlays/dividers

## Core Layouts

### Homepage/Streaming Hub

**Hero Section** (80vh):
- Large hero image: DJ performing in neon-lit venue with geometric light patterns
- Overlay: Frosted glass/blur effect content container
- Featured live stream previews with geometric card frames
- CTAs with blurred backgrounds when over imagery

**Live Now Grid** (below fold):
- 3-column desktop, 2-column tablet, 1-column mobile
- Stream cards: Thumbnail, streamer avatar (hexagon/octagon mask), viewer count, category tags
- Geometric accent borders on hover state

**Trending DJs Carousel**:
- Horizontal scrolling artist cards
- Large circular/geometric avatar frames
- Follower count, genre tags
- "Follow" CTAs

**Featured Collections**:
- 2-column split: Curated playlists + NFT drops
- Geometric card containers with angled corners
- Mixed media: album art, waveform visualizations

### Stream Page

**Layout**: Sidebar navigation (left 240px) + Main content + Chat sidebar (right 320px)

**Video Player Zone**:
- 16:9 aspect ratio, full-width between sidebars
- Geometric frame treatment
- Controls: Play/pause, volume, quality, fullscreen, viewer count
- Live indicator with pulsing animation

**Below Stream**:
- DJ profile: Avatar (geometric shape), name, follower count, bio
- Tab navigation: About, Tracklist, Schedule
- Monetization strip: Tip button, Subscribe tiers (3 geometric cards), NFT showcase

**Chat Sidebar**:
- Message stream with timestamp
- Emote panel (geometric grid)
- Viewer list accordion

### DJ Dashboard

**Stats Overview** (top):
- 4-column metrics: Live viewers, Total followers, Revenue, Stream hours
- Geometric stat cards with icon headers

**Quick Actions Panel**:
- Grid of action cards: Start Stream, Schedule, Upload Track, Mint NFT
- Geometric button containers

**Revenue Analytics**:
- Graph visualization with geometric data points
- Breakdown: Tips, Subscriptions, NFT sales

### Discover/Browse

**Filter Sidebar** (left):
- Genre checkboxes, Live status toggle, Viewer count slider
- Geometric dividers between sections

**Results Grid**:
- Masonry-style stream/DJ cards
- Mixed heights for visual interest
- Geometric overlays showing metadata

## Component Library

**Navigation Bar**: 
- Logo left, search center, profile/notifications right
- Geometric separator between sections
- Sticky positioning

**Stream Cards**: 
- Thumbnail with geometric overlay
- Avatar (hexagon mask), title, category
- Viewer count with live indicator dot

**Buttons**: 
- Primary: Bold with geometric corners
- Secondary: Outlined geometric shape
- Icon buttons: Circular/octagonal containers
- Blurred backgrounds when over images

**Modal/Overlays**: 
- Frosted glass backdrop blur
- Geometric container shapes
- Slide-in from right for panels

**Forms**:
- Geometric input containers
- Floating labels
- Inline validation with icons

**NFT Cards**:
- Square/hexagonal containers
- Album art, title, artist, price
- Geometric price tag overlay

**Waveform Visualizers**:
- Geometric bar patterns
- Integrated into player and track cards

## Images

**Hero Image**: DJ performing with geometric neon lighting, bokeh effects, modern club environment - full-width, 80vh

**Stream Thumbnails**: Live DJ performance shots, studio setups, crowd energy - 16:9 ratio cards

**Profile Avatars**: Professional DJ headshots - hexagonal/octagonal masks throughout

**NFT Artwork**: Album covers, visualizer art - square/geometric containers

**Background Treatments**: Subtle geometric patterns, gradient meshes for depth - used sparingly in empty states

**Category Banners**: Genre-specific imagery (techno, house, etc.) with geometric overlays - horizontal cards

## Geometric Elements

- Angled corners (8-12° clips) on cards
- Hexagonal/octagonal avatar masks
- Diagonal divider lines between sections
- Triangular accent shapes in backgrounds
- Grid overlays on imagery
- Wireframe geometric patterns for loading states

## Layout Refinements

**Asymmetry**: Offset hero content, staggered card heights in discovery grid
**Depth**: Layered geometric shapes, frosted glass panels over backgrounds
**Visual Rhythm**: Alternating section densities - tight streaming grid to spacious monetization showcase
**Negative Space**: Breathing room around primary CTAs and stream player