import { mongoDb } from "./db";

export const EDITORIAL_CATEGORIES = [
  { id: "c1", name: "Afrobeat", gradient: "linear-gradient(135deg, #FF6B35, #F7C59F)" },
  { id: "c2", name: "Amapiano", gradient: "linear-gradient(135deg, #7B2D8E, #9D4EDD)" },
  { id: "c3", name: "Highlife", gradient: "linear-gradient(135deg, #2D9CDB, #56CCF2)" },
  { id: "c4", name: "Drill", gradient: "linear-gradient(135deg, #333333, #666666)" },
  { id: "c5", name: "Gospel", gradient: "linear-gradient(135deg, #F2C94C, #F2994A)" },
  { id: "c6", name: "Jazz", gradient: "linear-gradient(135deg, #27AE60, #2ECC71)" },
  { id: "c7", name: "House", gradient: "linear-gradient(135deg, #E74C3C, #C0392B)" },
  { id: "c8", name: "Alté", gradient: "linear-gradient(135deg, #8E44AD, #9B59B6)" },
  { id: "c9", name: "Fuji", gradient: "linear-gradient(135deg, #D35400, #E67E22)" },
  { id: "c10", name: "Party", gradient: "linear-gradient(135deg, #1ABC9C, #16A085)" },
  { id: "c11", name: "Chill", gradient: "linear-gradient(135deg, #34495E, #2C3E50)" },
  { id: "c12", name: "Focus", gradient: "linear-gradient(135deg, #95A5A6, #7F8C8D)" },
];

export const EDITORIAL_ARTISTS = [
  { id: "a1", name: "Wizkid", followers: "12.4M", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop", genre: "Afrobeat", verified: true },
  { id: "a2", name: "Burna Boy", followers: "8.7M", image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop", genre: "Afro-fusion", verified: true },
  { id: "a3", name: "Tems", followers: "4.2M", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop", genre: "Alté", verified: true },
  { id: "a4", name: "Rema", followers: "6.1M", image: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&h=300&fit=crop", genre: "Afropop", verified: true },
  { id: "a5", name: "Davido", followers: "15.3M", image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop", genre: "Afrobeats", verified: true },
  { id: "a6", name: "Ayra Starr", followers: "3.8M", image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop", genre: "Afropop", verified: true },
  { id: "a7", name: "Asake", followers: "5.5M", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop", genre: "Amapiano", verified: true },
  { id: "a8", name: "Omah Lay", followers: "4.9M", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop", genre: "Afrobeat", verified: true },
];

export const EDITORIAL_ALBUMS = [
  { id: "alb1", title: "Made in Lagos", artist: "Wizkid", year: 2020, trackCount: 14, cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  { id: "alb2", title: "Twice as Tall", artist: "Burna Boy", year: 2020, trackCount: 15, cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  { id: "alb3", title: "For Broken Ears", artist: "Tems", year: 2020, trackCount: 7, cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop" },
  { id: "alb4", title: "Rave & Roses", artist: "Rema", year: 2022, trackCount: 16, cover: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=300&h=300&fit=crop" },
  { id: "alb5", title: "A Better Time", artist: "Davido", year: 2020, trackCount: 17, cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop" },
  { id: "alb6", title: "19 & Dangerous", artist: "Ayra Starr", year: 2021, trackCount: 11, cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop" },
  { id: "alb7", title: "Mr. Money with the Vibe", artist: "Asake", year: 2022, trackCount: 12, cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop" },
  { id: "alb8", title: "Boy Alone", artist: "Omah Lay", year: 2022, trackCount: 14, cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop" },
];

export const EDITORIAL_PLAYLISTS = [
  { id: "pl1", name: "Afrobeat Essentials", description: "The best of Afrobeat from Nigeria and beyond", trackCount: 45, cover: "https://images.unsplash.com/photo-1514525253440-b39345208668?w=300&h=300&fit=crop", curator: "STINE" },
  { id: "pl2", name: "Amapiano Wave", description: "South African piano house vibes", trackCount: 38, cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop", curator: "STINE" },
  { id: "pl3", name: "Late Night Drive", description: "Chill vibes for midnight cruising", trackCount: 32, cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop", curator: "STINE" },
  { id: "pl4", name: "Workout Energy", description: "High BPM tracks to power your workout", trackCount: 28, cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop", curator: "STINE" },
  { id: "pl5", name: "Gospel House", description: "Praise and worship meets house music", trackCount: 22, cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop", curator: "STINE" },
  { id: "pl6", name: "Highlife Classics", description: "Timeless highlife from Ghana and Nigeria", trackCount: 30, cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop", curator: "STINE" },
  { id: "pl7", name: "Drill & Street", description: "UK and African drill sounds", trackCount: 25, cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop", curator: "STINE" },
  { id: "pl8", name: "Jazz Lounge", description: "Smooth jazz and lounge music", trackCount: 20, cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=300&h=300&fit=crop", curator: "STINE" },
];

export async function seedEditorialContent() {
  if (!mongoDb) return;
  try {
    const [catCount, artCount, albCount, plCount] = await Promise.all([
      mongoDb.collection("categories").countDocuments(),
      mongoDb.collection("featured_artists").countDocuments(),
      mongoDb.collection("featured_albums").countDocuments(),
      mongoDb.collection("featured_playlists").countDocuments(),
    ]);
    const ops: Promise<any>[] = [];
    if (catCount === 0) ops.push(mongoDb.collection("categories").insertMany(EDITORIAL_CATEGORIES));
    if (artCount === 0) ops.push(mongoDb.collection("featured_artists").insertMany(EDITORIAL_ARTISTS));
    if (albCount === 0) ops.push(mongoDb.collection("featured_albums").insertMany(EDITORIAL_ALBUMS));
    if (plCount === 0) ops.push(mongoDb.collection("featured_playlists").insertMany(EDITORIAL_PLAYLISTS));
    if (ops.length > 0) {
      await Promise.all(ops);
      console.log(`[seeder] Seeded ${ops.length} editorial collection(s)`);
    }
  } catch (e) {
    console.error("[seeder] Error seeding editorial content:", e);
  }
}
