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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  artist: varchar("artist").notNull(),
  duration: integer("duration").notNull(), // in seconds
  fileUrl: varchar("file_url"),
  albumArt: varchar("album_art"),
  genre: varchar("genre"),
  bpm: integer("bpm"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(true),
  playCount: integer("play_count").default(0),
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
