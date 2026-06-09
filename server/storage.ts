import {
  users,
  tracks,
  streams,
  chatMessages,
  songRequests,
  rooms,
  follows,
  transactions,
  payouts,
  platformRevenue,
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
import { db, mongoDb } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { MongoStorage } from "./mongoStorage";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
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

  // Payment and transaction operations
  createTransaction(data: any): Promise<any>;
  getUserTransactions(userId: string, limit?: number): Promise<any[]>;
  getAllTransactions(): Promise<any[]>;
  createPayout(data: any): Promise<any>;
  getUserPayouts(userId: string): Promise<any[]>;
  getAllPayouts(): Promise<any[]>;
  updatePayoutStatus(id: string, status: string): Promise<void>;
  getPlatformRevenue(): Promise<any>;
}

// In-memory fallback for when no database is available
class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private tracks: Map<string, Track> = new Map();
  private streams: Map<string, Stream> = new Map();
  private messages: Map<string, ChatMessage> = new Map();
  private requests: Map<string, SongRequest> = new Map();
  private rooms: Map<string, Room> = new Map();
  private follows: Map<string, { followerId: string; followingId: string }> = new Map();
  private transactions: Map<string, any> = new Map();
  private payouts: Map<string, any> = new Map();
  private platformRevenue: Map<string, any> = new Map();
  private idCounter = 0;

  private genId(): string {
    return `mem-${++this.idCounter}`;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user = {
      ...userData,
      id: userData.id || this.genId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.set(user.id, user);
    return user;
  }

  async updateUserStreamingStatus(id: string, isStreaming: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isStreaming = isStreaming;
      user.updatedAt = new Date();
    }
  }

  async getUserByDjName(djName: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.djName === djName);
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const newTrack = {
      ...track,
      id: this.genId(),
      createdAt: new Date(),
    } as Track;
    this.tracks.set(newTrack.id, newTrack);
    return newTrack;
  }

  async getUserTracks(userId: string): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter(t => t.userId === userId);
  }

  async getTrack(id: string): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async createStream(stream: InsertStream): Promise<Stream> {
    const newStream = {
      ...stream,
      id: this.genId(),
      isLive: true,
      startedAt: new Date(),
      createdAt: new Date(),
    } as Stream;
    this.streams.set(newStream.id, newStream);
    return newStream;
  }

  async getUserCurrentStream(userId: string): Promise<Stream | undefined> {
    return Array.from(this.streams.values()).find(s => s.userId === userId && s.isLive);
  }

  async updateStreamStatus(streamId: string, isLive: boolean): Promise<void> {
    const stream = this.streams.get(streamId);
    if (stream) stream.isLive = isLive;
  }

  async updateStreamListenerCount(streamId: string, count: number): Promise<void> {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.listenerCount = count;
      stream.peakListeners = Math.max(stream.peakListeners || 0, count);
    }
  }

  async endStream(streamId: string): Promise<void> {
    const stream = this.streams.get(streamId);
    if (stream) {
      stream.isLive = false;
      stream.endedAt = new Date();
    }
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMsg = {
      ...message,
      id: this.genId(),
      createdAt: new Date(),
    } as ChatMessage;
    this.messages.set(newMsg.id, newMsg);
    return newMsg;
  }

  async getStreamChatMessages(streamId: string, limit = 50): Promise<ChatMessage[]> {
    return Array.from(this.messages.values())
      .filter(m => m.streamId === streamId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async addSongRequest(request: InsertSongRequest): Promise<SongRequest> {
    const newReq = {
      ...request,
      id: this.genId(),
      requestedAt: new Date(),
    } as SongRequest;
    this.requests.set(newReq.id, newReq);
    return newReq;
  }

  async getStreamSongRequests(streamId: string): Promise<SongRequest[]> {
    return Array.from(this.requests.values())
      .filter(r => r.streamId === streamId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  async updateSongRequestStatus(id: string, status: string): Promise<void> {
    const req = this.requests.get(id);
    if (req) {
      req.status = status;
      req.respondedAt = new Date();
    }
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const newRoom = {
      ...room,
      id: this.genId(),
      createdAt: new Date(),
    } as Room;
    this.rooms.set(newRoom.id, newRoom);
    return newRoom;
  }

  async getActiveRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(r => r.isActive);
  }

  async updateRoomListenerCount(roomId: string, count: number): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) room.listenerCount = count;
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    this.follows.set(`${followerId}-${followingId}`, { followerId, followingId });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    this.follows.delete(`${followerId}-${followingId}`);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.follows.has(`${followerId}-${followingId}`);
  }

  async createTransaction(data: any): Promise<any> {
    const tx = { ...data, id: this.genId(), createdAt: new Date() };
    this.transactions.set(tx.id, tx);
    return tx;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<any[]> {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getAllTransactions(): Promise<any[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPayout(data: any): Promise<any> {
    const payout = { ...data, id: this.genId(), requestedAt: new Date() };
    this.payouts.set(payout.id, payout);
    return payout;
  }

  async getUserPayouts(userId: string): Promise<any[]> {
    return Array.from(this.payouts.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  async getAllPayouts(): Promise<any[]> {
    return Array.from(this.payouts.values())
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  async updatePayoutStatus(id: string, status: string): Promise<void> {
    const p = this.payouts.get(id);
    if (p) p.status = status;
  }

  async getPlatformRevenue(): Promise<any> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return this.platformRevenue.get(currentMonth) || null;
  }
}

// Database-backed storage
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db!.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: { ...userData, updatedAt: new Date() },
    }).returning();
    return user;
  }

  async updateUserStreamingStatus(id: string, isStreaming: boolean): Promise<void> {
    await db!.update(users).set({ isStreaming, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async getUserByDjName(djName: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.djName, djName));
    return user;
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const [newTrack] = await db!.insert(tracks).values(track).returning();
    return newTrack;
  }

  async getUserTracks(userId: string): Promise<Track[]> {
    return await db!.select().from(tracks).where(eq(tracks.userId, userId)).orderBy(desc(tracks.createdAt));
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db!.select().from(tracks).where(eq(tracks.id, id));
    return track;
  }

  async createStream(stream: InsertStream): Promise<Stream> {
    const [newStream] = await db!.insert(streams).values({ ...stream, startedAt: new Date(), isLive: true }).returning();
    return newStream;
  }

  async getUserCurrentStream(userId: string): Promise<Stream | undefined> {
    const [stream] = await db!.select().from(streams).where(and(eq(streams.userId, userId), eq(streams.isLive, true))).orderBy(desc(streams.createdAt)).limit(1);
    return stream;
  }

  async updateStreamStatus(streamId: string, isLive: boolean): Promise<void> {
    await db!.update(streams).set({ isLive }).where(eq(streams.id, streamId));
  }

  async updateStreamListenerCount(streamId: string, count: number): Promise<void> {
    await db!.update(streams).set({ listenerCount: count, peakListeners: sql`GREATEST(peak_listeners, ${count})` }).where(eq(streams.id, streamId));
  }

  async endStream(streamId: string): Promise<void> {
    await db!.update(streams).set({ isLive: false, endedAt: new Date(), totalDuration: sql`EXTRACT(EPOCH FROM (NOW() - started_at))` }).where(eq(streams.id, streamId));
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db!.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getStreamChatMessages(streamId: string, limit = 50): Promise<ChatMessage[]> {
    return await db!.select().from(chatMessages).where(eq(chatMessages.streamId, streamId)).orderBy(desc(chatMessages.createdAt)).limit(limit);
  }

  async addSongRequest(request: InsertSongRequest): Promise<SongRequest> {
    const [newRequest] = await db!.insert(songRequests).values(request).returning();
    return newRequest;
  }

  async getStreamSongRequests(streamId: string): Promise<SongRequest[]> {
    return await db!.select().from(songRequests).where(eq(songRequests.streamId, streamId)).orderBy(desc(songRequests.requestedAt));
  }

  async updateSongRequestStatus(id: string, status: string): Promise<void> {
    await db!.update(songRequests).set({ status, respondedAt: new Date() }).where(eq(songRequests.id, id));
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db!.insert(rooms).values(room).returning();
    return newRoom;
  }

  async getActiveRooms(): Promise<Room[]> {
    return await db!.select().from(rooms).where(eq(rooms.isActive, true)).orderBy(desc(rooms.listenerCount));
  }

  async updateRoomListenerCount(roomId: string, count: number): Promise<void> {
    await db!.update(rooms).set({ listenerCount: count }).where(eq(rooms.id, roomId));
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    await db!.insert(follows).values({ followerId, followingId });
    await db!.update(users).set({ followerCount: sql`follower_count + 1` }).where(eq(users.id, followingId));
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db!.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    await db!.update(users).set({ followerCount: sql`GREATEST(follower_count - 1, 0)` }).where(eq(users.id, followingId));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db!.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  async createTransaction(data: any): Promise<any> {
    const [transaction] = await db!.insert(transactions).values(data).returning();
    return transaction;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<any[]> {
    return await db!.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(limit);
  }

  async getAllTransactions(): Promise<any[]> {
    return await db!.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createPayout(data: any): Promise<any> {
    const [payout] = await db!.insert(payouts).values(data).returning();
    return payout;
  }

  async getUserPayouts(userId: string): Promise<any[]> {
    return await db!.select().from(payouts).where(eq(payouts.userId, userId)).orderBy(desc(payouts.requestedAt));
  }

  async getAllPayouts(): Promise<any[]> {
    return await db!.select().from(payouts).orderBy(desc(payouts.requestedAt));
  }

  async updatePayoutStatus(id: string, status: string): Promise<void> {
    await db!.update(payouts).set({ status }).where(eq(payouts.id, id));
  }

  async getPlatformRevenue(): Promise<any> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [revenue] = await db!.select().from(platformRevenue).where(eq(platformRevenue.month, currentMonth));
    return revenue;
  }
}

// Export the appropriate storage:
// 1. PostgreSQL (DATABASE_URL)
// 2. MongoDB Atlas (MONGODB_URI)
// 3. In-memory fallback
export const storage: IStorage = db
  ? new DatabaseStorage()
  : mongoDb
    ? new MongoStorage()
    : new MemStorage();
