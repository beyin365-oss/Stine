// ============================================================================
// STINE - Realistic Visual Mock Data for App Store / Play Store Screenshots
// ============================================================================

export const mockTracks = [
  { id: "t1", title: "Neon Lights", artist: "Synth Wave", duration: 225, bpm: 128, key: "A", energy: 8, genre: "electronic", albumArt: "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop" },
  { id: "t2", title: "Digital Horizon", artist: "Electric Soul", duration: 260, bpm: 124, key: "C#m", energy: 7, genre: "house", albumArt: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" },
  { id: "t3", title: "Cosmic Dance", artist: "Space Disco", duration: 312, bpm: 132, key: "G", energy: 9, genre: "techno", albumArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  { id: "t4", title: "Midnight Bass", artist: "Deep City", duration: 285, bpm: 120, key: "F", energy: 6, genre: "deep-house", albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
  { id: "t5", title: "Afrobeat Soul", artist: "Lagos Groove", duration: 340, bpm: 118, key: "D", energy: 8, genre: "afrobeat", albumArt: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  { id: "t6", title: "Highlife Fusion", artist: "Accra Vibes", duration: 295, bpm: 110, key: "E", energy: 7, genre: "highlife", albumArt: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop" },
  { id: "t7", title: "Alt\u00e9 Groove", artist: "Naija Collective", duration: 275, bpm: 116, key: "Bb", energy: 9, genre: "alte", albumArt: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop" },
  { id: "t8", title: "Drill Beat", artist: "Lagos Street", duration: 180, bpm: 140, key: "Cm", energy: 10, genre: "drill", albumArt: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop" },
  { id: "t9", title: "Amapiano Wave", artist: "Pretoria Sound", duration: 360, bpm: 112, key: "G", energy: 7, genre: "amapiano", albumArt: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&h=300&fit=crop" },
  { id: "t10", title: "Fuji Remix", artist: "Ibadan Vibes", duration: 320, bpm: 125, key: "A", energy: 8, genre: "fuji", albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
  { id: "t11", title: "Gospel House", artist: "Heavenly Beats", duration: 290, bpm: 122, key: "F", energy: 6, genre: "gospel", albumArt: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop" },
  { id: "t12", title: "Jazz Lounge", artist: "Smooth Collective", duration: 310, bpm: 95, key: "Eb", energy: 4, genre: "jazz", albumArt: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop" },
];

export const mockPlaylist = {
  id: "p1",
  name: "Afro-Future Mix",
  description: "A curated blend of Afrobeat, Amapiano, and electronic sounds for the modern dancefloor",
  tracks: [mockTracks[4], mockTracks[6], mockTracks[8], mockTracks[9], mockTracks[0], mockTracks[2]],
};

export const mockWaveform = Array.from({ length: 60 }, () => Math.random() * 80 + 20);

export const mockAIRecommendations = [
  { id: "r1", title: "Switch to Amapiano after track 3", confidence: 0.92, type: "genre-shift" },
  { id: "r2", title: "Your peak engagement is at 8PM WAT", confidence: 0.88, type: "timing" },
  { id: "r3", title: "Add more Afrobeat to boost Nigerian audience", confidence: 0.85, type: "audience" },
  { id: "r4", title: "Tempo should build from 118 to 132 BPM", confidence: 0.91, type: "energy" },
  { id: "r5", title: "Crossfade at 2:45 for seamless transition", confidence: 0.87, type: "mixing" },
];

export const mockChatMessages = [
  { id: "c1", userId: "u1", message: "This set is fire! \ud83d\udd25", createdAt: "2025-06-09T20:01:00Z", username: "DJ_Kenny" },
  { id: "c2", userId: "u2", message: "That Amapiano transition was smooth", createdAt: "2025-06-09T20:02:30Z", username: "BeatsByTola" },
  { id: "c3", userId: "u3", message: "Can you play more Afrobeat?", createdAt: "2025-06-09T20:03:15Z", username: "NaijaFan" },
  { id: "c4", userId: "u4", message: "Love the energy! \u26a1", createdAt: "2025-06-09T20:04:00Z", username: "LagosVibez" },
  { id: "c5", userId: "u5", message: "DJ from Lagos checking in", createdAt: "2025-06-09T20:05:00Z", username: "LekkiBoy" },
  { id: "c6", userId: "u6", message: "This track selection is elite", createdAt: "2025-06-09T20:06:00Z", username: "MusicHead" },
  { id: "c7", userId: "u7", message: "Where you streaming from?", createdAt: "2025-06-09T20:07:00Z", username: "CapeTown" },
  { id: "c8", userId: "u8", message: "Accra, Ghana! Big up yourself", createdAt: "2025-06-09T20:08:00Z", username: "GhanaBoi" },
];

export const mockAnalyticsData = {
  listenerStats: { total: 2847, peak: 4102, average: 2150, growth: 23 },
  engagement: { likes: 1562, comments: 847, shares: 324, tips: 2340 },
  demographics: {
    ageGroups: [
      { name: "18-24", value: 35 },
      { name: "25-34", value: 42 },
      { name: "35-44", value: 18 },
      { name: "45+", value: 5 },
    ],
    locations: [
      { country: "Nigeria", listeners: 1247 },
      { country: "Ghana", listeners: 432 },
      { country: "South Africa", listeners: 389 },
      { country: "Kenya", listeners: 298 },
      { country: "UK", listeners: 156 },
      { country: "USA", listeners: 142 },
    ],
    devices: [
      { type: "Mobile", percentage: 68 },
      { type: "Desktop", percentage: 24 },
      { type: "Tablet", percentage: 8 },
    ],
  },
  timeSeriesData: [
    { time: "18:00", listeners: 450, engagement: 62, energy: 55 },
    { time: "19:00", listeners: 890, engagement: 75, energy: 68 },
    { time: "20:00", listeners: 1240, engagement: 88, energy: 82 },
    { time: "21:00", listeners: 1850, engagement: 92, energy: 90 },
    { time: "22:00", listeners: 2100, engagement: 95, energy: 94 },
    { time: "23:00", listeners: 2847, engagement: 98, energy: 97 },
  ],
  topTracks: [
    { title: "Afrobeat Soul", artist: "Lagos Groove", plays: 1240, likes: 892, requests: 156 },
    { title: "Amapiano Wave", artist: "Pretoria Sound", plays: 1102, likes: 745, requests: 134 },
    { title: "Neon Lights", artist: "Synth Wave", plays: 987, likes: 623, requests: 98 },
    { title: "Alt\u00e9 Groove", artist: "Naija Collective", plays: 856, likes: 578, requests: 87 },
    { title: "Digital Horizon", artist: "Electric Soul", plays: 723, likes: 456, requests: 65 },
  ],
  aiInsights: {
    audienceProfile: "Your audience is predominantly 25-34 year olds from Nigeria, Ghana, and South Africa. They love high-energy Afrobeat and Amapiano with occasional electronic blends. Peak engagement is at 8-9 PM WAT on weekends.",
    recommendations: [
      "Add more Amapiano tracks - 78% of your Nigerian audience requests this",
      "Stream between 7-10 PM WAT for maximum African engagement",
      "Include Alt\u00e9 tracks to attract the Lagos creative crowd",
      "Your follower count spikes when you mix Afrobeat with House",
      "Add chat interaction prompts - your engagement rate is 23% above average",
    ],
    bestPerformingGenres: ["Afrobeat", "Amapiano", "House", "Alt\u00e9"],
    optimalStreamingTimes: ["Fri 8PM", "Sat 9PM", "Sun 7PM", "Wed 8PM"],
    engagementTrends: "Engagement has increased 23% over the last month. Your Nigerian audience is growing fastest (+34%). Fans who tip tend to return 4x more often.",
  },
};

export const mockRecordings = [
  { id: "rec1", title: "Lagos Sunset Mix", description: "Deep Afrobeat session from Lagos", duration: 3600, fileSize: 86400000, isPublic: true, playCount: 342, downloadCount: 89, createdAt: "2025-06-01T18:00:00Z" },
  { id: "rec2", title: "Accra Friday Night", description: "Highlife meets electronic", duration: 4200, fileSize: 100800000, isPublic: true, playCount: 267, downloadCount: 56, createdAt: "2025-06-05T21:00:00Z" },
  { id: "rec3", title: "Amapiano Workshop", description: "Educational Amapiano mixing session", duration: 2800, fileSize: 67200000, isPublic: true, playCount: 198, downloadCount: 45, createdAt: "2025-06-07T20:00:00Z" },
];

export const mockActiveDJ = {
  id: "dj1",
  djName: "DJ Stine",
  bio: "Afro-future sounds from Lagos. Bringing the best of Afrobeat, Amapiano, and electronic music to the world.",
  totalStreams: 47,
  totalEarnings: 12340,
  followerCount: 2847,
  isStreaming: true,
  verificationLevel: "verified",
  genres: ["afrobeat", "amapiano", "house", "alte"],
  profileImageUrl: "",
};

export const mockLiveStreams = [
  { id: "ls1", title: "Afro-Future Friday", description: "Weekly Afrobeat & Amapiano mix", listenerCount: 2847, isLive: true, startedAt: "2025-06-09T20:00:00Z", genre: "afrobeat" },
  { id: "ls2", title: "Late Night Jazz House", description: "Smooth jazz-house fusion", listenerCount: 432, isLive: true, startedAt: "2025-06-09T21:00:00Z", genre: "jazz-house" },
  { id: "ls3", title: "Accra Highlife Session", description: "Classic highlife with modern twist", listenerCount: 289, isLive: true, startedAt: "2025-06-09T19:30:00Z", genre: "highlife" },
  { id: "ls4", title: "Amapiano Underground", description: "Deep amapiano cuts from SA", listenerCount: 156, isLive: true, startedAt: "2025-06-09T20:30:00Z", genre: "amapiano" },
  { id: "ls5", title: "Gospel House Praise", description: "Gospel meets house music", listenerCount: 98, isLive: true, startedAt: "2025-06-09T18:00:00Z", genre: "gospel" },
];
