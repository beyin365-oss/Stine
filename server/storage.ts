import {
  users,
  tracks,
  streams,
  chatMessages,
  songRequests,
  rooms,
  follows,
  type User,
  type UpsertUser,
  type Track,
  type InsertTrack,
  type Stream,
  type InsertStream,
  type ChatMessage,
  type InsertChatMessage,
  type SongRequest,
  type InsertSongRequest,
  type Room,
  type InsertRoom,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // DJ/User operations
  updateUserStreamingStatus(id: string, isStreaming: boolean): Promise<void>;
  getUserByDjName(djName: string): Promise<User | undefined>;
  
  // Track operations
  createTrack(track: InsertTrack): Promise<Track>;
  getUserTracks(userId: string): Promise<Track[]>;
  getTrack(id: string): Promise<Track | undefined>;
  
  // Stream operations
  createStream(stream: InsertStream): Promise<Stream>;
  getUserCurrentStream(userId: string): Promise<Stream | undefined>;
  updateStreamStatus(streamId: string, isLive: boolean): Promise<void>;
  updateStreamListenerCount(streamId: string, count: number): Promise<void>;
  endStream(streamId: string): Promise<void>;
  
  // Chat operations
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getStreamChatMessages(streamId: string, limit?: number): Promise<ChatMessage[]>;
  
  // Song request operations
  addSongRequest(request: InsertSongRequest): Promise<SongRequest>;
  getStreamSongRequests(streamId: string): Promise<SongRequest[]>;
  updateSongRequestStatus(id: string, status: string): Promise<void>;
  
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getActiveRooms(): Promise<Room[]>;
  updateRoomListenerCount(roomId: string, count: number): Promise<void>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStreamingStatus(id: string, isStreaming: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isStreaming, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getUserByDjName(djName: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.djName, djName));
    return user;
  }

  // Track operations
  async createTrack(track: InsertTrack): Promise<Track> {
    const [newTrack] = await db.insert(tracks).values(track).returning();
    return newTrack;
  }

  async getUserTracks(userId: string): Promise<Track[]> {
    return await db
      .select()
      .from(tracks)
      .where(eq(tracks.userId, userId))
      .orderBy(desc(tracks.createdAt));
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track;
  }

  // Stream operations
  async createStream(stream: InsertStream): Promise<Stream> {
    const [newStream] = await db.insert(streams).values({
      ...stream,
      startedAt: new Date(),
      isLive: true,
    }).returning();
    return newStream;
  }

  async getUserCurrentStream(userId: string): Promise<Stream | undefined> {
    const [stream] = await db
      .select()
      .from(streams)
      .where(and(eq(streams.userId, userId), eq(streams.isLive, true)))
      .orderBy(desc(streams.createdAt))
      .limit(1);
    return stream;
  }

  async updateStreamStatus(streamId: string, isLive: boolean): Promise<void> {
    await db
      .update(streams)
      .set({ isLive })
      .where(eq(streams.id, streamId));
  }

  async updateStreamListenerCount(streamId: string, count: number): Promise<void> {
    await db
      .update(streams)
      .set({ 
        listenerCount: count,
        peakListeners: sql`GREATEST(peak_listeners, ${count})`
      })
      .where(eq(streams.id, streamId));
  }

  async endStream(streamId: string): Promise<void> {
    await db
      .update(streams)
      .set({ 
        isLive: false, 
        endedAt: new Date(),
        totalDuration: sql`EXTRACT(EPOCH FROM (NOW() - started_at))`
      })
      .where(eq(streams.id, streamId));
  }

  // Chat operations
  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getStreamChatMessages(streamId: string, limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.streamId, streamId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  // Song request operations
  async addSongRequest(request: InsertSongRequest): Promise<SongRequest> {
    const [newRequest] = await db.insert(songRequests).values(request).returning();
    return newRequest;
  }

  async getStreamSongRequests(streamId: string): Promise<SongRequest[]> {
    return await db
      .select()
      .from(songRequests)
      .where(eq(songRequests.streamId, streamId))
      .orderBy(desc(songRequests.requestedAt));
  }

  async updateSongRequestStatus(id: string, status: string): Promise<void> {
    await db
      .update(songRequests)
      .set({ status, respondedAt: new Date() })
      .where(eq(songRequests.id, id));
  }

  // Room operations
  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(room).returning();
    return newRoom;
  }

  async getActiveRooms(): Promise<Room[]> {
    return await db
      .select()
      .from(rooms)
      .where(eq(rooms.isActive, true))
      .orderBy(desc(rooms.listenerCount));
  }

  async updateRoomListenerCount(roomId: string, count: number): Promise<void> {
    await db
      .update(rooms)
      .set({ listenerCount: count })
      .where(eq(rooms.id, roomId));
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<void> {
    await db.insert(follows).values({ followerId, followingId });
    
    // Update follower count
    await db
      .update(users)
      .set({ followerCount: sql`follower_count + 1` })
      .where(eq(users.id, followingId));
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    
    // Update follower count
    await db
      .update(users)
      .set({ followerCount: sql`GREATEST(follower_count - 1, 0)` })
      .where(eq(users.id, followingId));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }
}

export const storage = new DatabaseStorage();
