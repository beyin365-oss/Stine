import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  djName: varchar("dj_name"),
  bio: text("bio"),
  isStreaming: boolean("is_streaming").default(false),
  followerCount: integer("follower_count").default(0),
  totalStreams: integer("total_streams").default(0),
  totalStreamTime: integer("total_stream_time").default(0), // in minutes
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default('0.00'),
  verificationLevel: varchar("verification_level").default('basic'), // basic, verified, pro
  genres: text("genres").array(), // preferred genres
  socialLinks: jsonb("social_links"), // { twitter: '', instagram: '', etc. }
  timezone: varchar("timezone").default('UTC'),
  isOnline: boolean("is_online").default(false),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  subscriptionLevel: varchar("subscription_level").default('free'), // free, basic, pro, premium
  achievementPoints: integer("achievement_points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  artist: varchar("artist").notNull(),
  duration: integer("duration").notNull(), // in seconds
  fileUrl: varchar("file_url"),
  waveformUrl: varchar("waveform_url"), // pre-generated waveform data
  albumArt: varchar("album_art"),
  genre: varchar("genre"),
  subGenre: varchar("sub_genre"),
  bpm: integer("bpm"),
  key: varchar("key"), // musical key (A, Bb, C#m, etc.)
  energy: integer("energy"), // 1-10 scale
  danceability: integer("danceability"), // 1-10 scale
  userId: varchar("user_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true),
  isOriginal: boolean("is_original").default(true), // vs remix/bootleg
  playCount: integer("play_count").default(0),
  likeCount: integer("like_count").default(0),
  downloadCount: integer("download_count").default(0),
  fileSize: integer("file_size"), // in bytes
  audioFormat: varchar("audio_format").default('mp3'), // mp3, wav, flac
  sampleRate: integer("sample_rate"), // 44100, 48000, etc.
  bitrate: integer("bitrate"), // 128, 320, etc.
  tags: text("tags").array(), // custom tags
  mood: varchar("mood"), // energetic, chill, dark, etc.
  isExplicit: boolean("is_explicit").default(false),
  releaseDate: timestamp("release_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true),
  trackIds: text("track_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const streams = pgTable("streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  currentTrackId: varchar("current_track_id").references(() => tracks.id),
  listenerCount: integer("listener_count").default(0),
  isLive: boolean("is_live").default(false),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  totalDuration: integer("total_duration").default(0), // in seconds
  peakListeners: integer("peak_listeners").default(0),
  totalLikes: integer("total_likes").default(0),
  totalComments: integer("total_comments").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => streams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type").default('chat'), // 'chat', 'like', 'follow', 'request'
  createdAt: timestamp("created_at").defaultNow(),
});

export const songRequests = pgTable("song_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => streams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  songTitle: varchar("song_title").notNull(),
  artist: varchar("artist"),
  status: varchar("status").default('pending'), // 'pending', 'accepted', 'declined', 'played'
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id).notNull(),
  followingId: varchar("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  genre: varchar("genre"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(false),
  listenerCount: integer("listener_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription tiers and user subscriptions
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  features: text("features").array(),
  maxConcurrentStreams: integer("max_concurrent_streams").default(1),
  maxUploadSize: integer("max_upload_size").default(100), // MB
  hasAdvancedAnalytics: boolean("has_advanced_analytics").default(false),
  hasRecording: boolean("has_recording").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tierId: varchar("tier_id").references(() => subscriptionTiers.id).notNull(),
  status: varchar("status").default('active'), // active, cancelled, expired
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tips and donations
export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  streamId: varchar("stream_id").references(() => streams.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  currency: varchar("currency").default('USD'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stream recordings
export const recordings = pgTable("recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => streams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  fileUrl: varchar("file_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration").notNull(), // in seconds
  isPublic: boolean("is_public").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// DJ achievements and badges
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  iconUrl: varchar("icon_url"),
  category: varchar("category").notNull(), // streaming, social, technical, etc.
  requirement: jsonb("requirement").notNull(), // { type: 'stream_hours', value: 100 }
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: varchar("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Scheduled streams
export const scheduledStreams = pgTable("scheduled_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration"), // estimated duration in minutes
  genre: varchar("genre"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern"), // weekly, daily, etc.
  reminderSent: boolean("reminder_sent").default(false),
  status: varchar("status").default('scheduled'), // scheduled, live, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // follow, tip, stream_start, achievement, etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // additional context data
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Merchandise
export const merchandise = pgTable("merchandise", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  category: varchar("category"), // tshirt, sticker, vinyl, etc.
  inventory: integer("inventory").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Advanced track features
export const trackCollaborations = pgTable("track_collaborations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").references(() => tracks.id).notNull(),
  collaboratorId: varchar("collaborator_id").references(() => users.id).notNull(),
  role: varchar("role").notNull(), // producer, vocalist, remixer, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// DJ equipment presets
export const djPresets = pgTable("dj_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  settings: jsonb("settings").notNull(), // EQ, effects, crossfader settings
  isPublic: boolean("is_public").default(false),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tracks: many(tracks),
  streams: many(streams),
  playlists: many(playlists),
  chatMessages: many(chatMessages),
  songRequests: many(songRequests),
  rooms: many(rooms),
}));

export const tracksRelations = relations(tracks, ({ one }) => ({
  user: one(users, {
    fields: [tracks.userId],
    references: [users.id],
  }),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  user: one(users, {
    fields: [streams.userId],
    references: [users.id],
  }),
  currentTrack: one(tracks, {
    fields: [streams.currentTrackId],
    references: [tracks.id],
  }),
  chatMessages: many(chatMessages),
  songRequests: many(songRequests),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  stream: one(streams, {
    fields: [chatMessages.streamId],
    references: [streams.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  createdAt: true,
});

export const insertStreamSchema = createInsertSchema(streams).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSongRequestSchema = createInsertSchema(songRequests).omit({
  id: true,
  requestedAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for new tables
export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledStreamSchema = createInsertSchema(scheduledStreams).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertMerchandiseSchema = createInsertSchema(merchandise).omit({
  id: true,
  createdAt: true,
});

export const insertDjPresetSchema = createInsertSchema(djPresets).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Stream = typeof streams.$inferSelect;
export type InsertStream = z.infer<typeof insertStreamSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type SongRequest = typeof songRequests.$inferSelect;
export type InsertSongRequest = z.infer<typeof insertSongRequestSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Follow = typeof follows.$inferSelect;

// New types for enhanced features
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Recording = typeof recordings.$inferSelect;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type ScheduledStream = typeof scheduledStreams.$inferSelect;
export type InsertScheduledStream = z.infer<typeof insertScheduledStreamSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Merchandise = typeof merchandise.$inferSelect;
export type InsertMerchandise = z.infer<typeof insertMerchandiseSchema>;
export type TrackCollaboration = typeof trackCollaborations.$inferSelect;
export type DjPreset = typeof djPresets.$inferSelect;
export type InsertDjPreset = z.infer<typeof insertDjPresetSchema>;
