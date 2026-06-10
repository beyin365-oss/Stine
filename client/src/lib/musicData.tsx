// ============================================================================
// STINE - Rich Music Data (Artists, Albums, Playlists, Categories)
// ============================================================================

export const mockArtists = [
  { id: "a1", name: "Wizkid", followers: "12.4M", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop", genre: "Afrobeat" },
  { id: "a2", name: "Burna Boy", followers: "8.7M", image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop", genre: "Afro-fusion" },
  { id: "a3", name: "Tems", followers: "4.2M", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop", genre: "Alt\u00e9" },
  { id: "a4", name: "Rema", followers: "6.1M", image: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&h=300&fit=crop", genre: "Afropop" },
  { id: "a5", name: "Davido", followers: "15.3M", image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop", genre: "Afrobeats" },
  { id: "a6", name: "Ayra Starr", followers: "3.8M", image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop", genre: "Afropop" },
  { id: "a7", name: "Asake", followers: "5.5M", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop", genre: "Amapiano" },
  { id: "a8", name: "Omah Lay", followers: "4.9M", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop", genre: "Afrobeat" },
];

export const mockAlbums = [
  { id: "alb1", title: "Made in Lagos", artist: "Wizkid", year: 2020, tracks: 14, cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  { id: "alb2", title: "Twice as Tall", artist: "Burna Boy", year: 2020, tracks: 15, cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  { id: "alb3", title: "For Broken Ears", artist: "Tems", year: 2020, tracks: 7, cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
  { id: "alb4", title: "Rave & Roses", artist: "Rema", year: 2022, tracks: 16, cover: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&h=300&fit=crop" },
  { id: "alb5", title: "A Better Time", artist: "Davido", year: 2020, tracks: 17, cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop" },
  { id: "alb6", title: "19 & Dangerous", artist: "Ayra Starr", year: 2021, tracks: 11, cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop" },
  { id: "alb7", title: "Mr. Money with the Vibe", artist: "Asake", year: 2022, tracks: 12, cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop" },
  { id: "alb8", title: "Boy Alone", artist: "Omah Lay", year: 2022, tracks: 14, cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop" },
];

export const mockPlaylists = [
  { id: "pl1", name: "Afrobeat Essentials", description: "The best of Afrobeat from Nigeria and beyond", trackCount: 45, cover: "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop" },
  { id: "pl2", name: "Amapiano Wave", description: "South African piano house vibes", trackCount: 38, cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop" },
  { id: "pl3", name: "Late Night Drive", description: "Chill vibes for midnight cruising", trackCount: 32, cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop" },
  { id: "pl4", name: "Workout Energy", description: "High BPM tracks to power your workout", trackCount: 28, cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  { id: "pl5", name: "Gospel House", description: "Praise and worship meets house music", trackCount: 22, cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop" },
  { id: "pl6", name: "Highlife Classics", description: "Timeless highlife from Ghana and Nigeria", trackCount: 30, cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  { id: "pl7", name: "Drill & Street", description: "UK and African drill sounds", trackCount: 25, cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop" },
  { id: "pl8", name: "Jazz Lounge", description: "Smooth jazz and lounge music", trackCount: 20, cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop" },
];

export const mockCategories = [
  { id: "c1", name: "Afrobeat", gradient: "linear-gradient(135deg, #FF6B35, #F7C59F)", icon: MusicIcon },
  { id: "c2", name: "Amapiano", gradient: "linear-gradient(135deg, #7B2D8E, #9D4EDD)", icon: MusicIcon },
  { id: "c3", name: "Highlife", gradient: "linear-gradient(135deg, #2D9CDB, #56CCF2)", icon: MusicIcon },
  { id: "c4", name: "Drill", gradient: "linear-gradient(135deg, #333333, #666666)", icon: MusicIcon },
  { id: "c5", name: "Gospel", gradient: "linear-gradient(135deg, #F2C94C, #F2994A)", icon: MusicIcon },
  { id: "c6", name: "Jazz", gradient: "linear-gradient(135deg, #27AE60, #2ECC71)", icon: MusicIcon },
  { id: "c7", name: "House", gradient: "linear-gradient(135deg, #E74C3C, #C0392B)", icon: MusicIcon },
  { id: "c8", name: "Alt\u00e9", gradient: "linear-gradient(135deg, #8E44AD, #9B59B6)", icon: MusicIcon },
  { id: "c9", name: "Fuji", gradient: "linear-gradient(135deg, #D35400, #E67E22)", icon: MusicIcon },
  { id: "c10", name: "Party", gradient: "linear-gradient(135deg, #1ABC9C, #16A085)", icon: MusicIcon },
  { id: "c11", name: "Chill", gradient: "linear-gradient(135deg, #34495E, #2C3E50)", icon: MusicIcon },
  { id: "c12", name: "Focus", gradient: "linear-gradient(135deg, #95A5A6, #7F8C8D)", icon: MusicIcon },
];

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  );
}

export const mockSearchHistory = [
  "Wizkid", "Amapiano", "Burna Boy", "Afrobeat", "Tems", "Lagos", "Highlife", "Davido"
];

export const mockUserProfile = {
  id: "u1",
  name: "DJ Stine",
  username: "djstine",
  bio: "Afro-future sounds from Lagos. Bringing the best of Afrobeat, Amapiano, and electronic music.",
  image: "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop",
  followers: 2847,
  following: 156,
  totalPlays: 45200,
  likedTracks: 234,
  playlists: 12,
  isDJ: true,
  subscription: "Pro",
  joinDate: "2023-01-15",
};

export const mockNotifications = [
  { id: "n1", title: "New follower", message: "DJ Kenny started following you", time: "2 min ago", read: false, type: "follow" },
  { id: "n2", title: "Stream tip", message: "Someone tipped you \u20a61,000", time: "15 min ago", read: false, type: "tip" },
  { id: "n3", title: "New stream", message: "Burna Boy is live now", time: "1 hour ago", read: true, type: "stream" },
  { id: "n4", title: "Song request", message: "User requested 'Amapiano Wave'", time: "2 hours ago", read: true, type: "request" },
  { id: "n5", title: "Playlist added", message: "Your playlist was added to 3 libraries", time: "3 hours ago", read: true, type: "playlist" },
  { id: "n6", title: "Subscription", message: "Your Pro subscription renews in 7 days", time: "1 day ago", read: true, type: "subscription" },
];
