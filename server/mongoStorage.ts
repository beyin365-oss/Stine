import { mongoDb } from "./db";
import { randomUUID } from "crypto";
import type {
  User, UpsertUser, Track, InsertTrack, Stream, InsertStream,
  ChatMessage, InsertChatMessage, SongRequest, InsertSongRequest,
  Room, InsertRoom
} from "@shared/schema";
import type { IStorage } from "./storage";

// MongoDB storage implementation for Atlas deployment
export class MongoStorage implements IStorage {
  private get collection() {
    if (!mongoDb) throw new Error("MongoDB not connected");
    return mongoDb.collection.bind(mongoDb);
  }

  private genId(): string {
    return randomUUID();
  }

  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.collection("users").findOne({ id });
    return doc ? this.docToUser(doc) : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.collection("users").findOne({ id: userData.id });
    const now = new Date();
    const user = {
      ...userData,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    } as User;
    await this.collection("users").updateOne(
      { id: userData.id },
      { $set: user },
      { upsert: true }
    );
    return user;
  }

  async updateUserStreamingStatus(id: string, isStreaming: boolean): Promise<void> {
    await this.collection("users").updateOne({ id }, { $set: { isStreaming, updatedAt: new Date() } });
  }

  async getUserByDjName(djName: string): Promise<User | undefined> {
    const doc = await this.collection("users").findOne({ djName });
    return doc ? this.docToUser(doc) : undefined;
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const newTrack = { ...track, id: this.genId(), createdAt: new Date() } as Track;
    await this.collection("tracks").insertOne(newTrack);
    return newTrack;
  }

  async getUserTracks(userId: string): Promise<Track[]> {
    const docs = await this.collection("tracks").find({ userId }).sort({ createdAt: -1 }).toArray();
    return docs.map(this.docToTrack);
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const doc = await this.collection("tracks").findOne({ id });
    return doc ? this.docToTrack(doc) : undefined;
  }

  async createStream(stream: InsertStream): Promise<Stream> {
    const newStream = { ...stream, id: this.genId(), isLive: true, startedAt: new Date(), createdAt: new Date() } as Stream;
    await this.collection("streams").insertOne(newStream);
    return newStream;
  }

  async getUserCurrentStream(userId: string): Promise<Stream | undefined> {
    const doc = await this.collection("streams").findOne({ userId, isLive: true }, { sort: { createdAt: -1 } });
    return doc ? this.docToStream(doc) : undefined;
  }

  async updateStreamStatus(streamId: string, isLive: boolean): Promise<void> {
    await this.collection("streams").updateOne({ id: streamId }, { $set: { isLive } });
  }

  async updateStreamListenerCount(streamId: string, count: number): Promise<void> {
    const doc = await this.collection("streams").findOne({ id: streamId });
    const peak = Math.max(doc?.peakListeners || 0, count);
    await this.collection("streams").updateOne({ id: streamId }, { $set: { listenerCount: count, peakListeners: peak } });
  }

  async endStream(streamId: string): Promise<void> {
    await this.collection("streams").updateOne(
      { id: streamId },
      { $set: { isLive: false, endedAt: new Date() } }
    );
  }

  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMsg = { ...message, id: this.genId(), createdAt: new Date() } as ChatMessage;
    await this.collection("chatMessages").insertOne(newMsg);
    return newMsg;
  }

  async getStreamChatMessages(streamId: string, limit = 50): Promise<ChatMessage[]> {
    const docs = await this.collection("chatMessages")
      .find({ streamId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(this.docToChatMessage);
  }

  async addSongRequest(request: InsertSongRequest): Promise<SongRequest> {
    const newReq = { ...request, id: this.genId(), requestedAt: new Date() } as SongRequest;
    await this.collection("songRequests").insertOne(newReq);
    return newReq;
  }

  async getStreamSongRequests(streamId: string): Promise<SongRequest[]> {
    const docs = await this.collection("songRequests").find({ streamId }).sort({ requestedAt: -1 }).toArray();
    return docs.map(this.docToSongRequest);
  }

  async updateSongRequestStatus(id: string, status: string): Promise<void> {
    await this.collection("songRequests").updateOne({ id }, { $set: { status, respondedAt: new Date() } });
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const newRoom = { ...room, id: this.genId(), createdAt: new Date() } as Room;
    await this.collection("rooms").insertOne(newRoom);
    return newRoom;
  }

  async getActiveRooms(): Promise<Room[]> {
    const docs = await this.collection("rooms").find({ isActive: true }).sort({ listenerCount: -1 }).toArray();
    return docs.map(this.docToRoom);
  }

  async updateRoomListenerCount(roomId: string, count: number): Promise<void> {
    await this.collection("rooms").updateOne({ id: roomId }, { $set: { listenerCount: count } });
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    await this.collection("follows").updateOne(
      { followerId, followingId },
      { $set: { followerId, followingId, createdAt: new Date() } },
      { upsert: true }
    );
    await this.collection("users").updateOne({ id: followingId }, { $inc: { followerCount: 1 } });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await this.collection("follows").deleteOne({ followerId, followingId });
    await this.collection("users").updateOne({ id: followingId }, { $inc: { followerCount: -1 } });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const doc = await this.collection("follows").findOne({ followerId, followingId });
    return !!doc;
  }

  async createTransaction(data: any): Promise<any> {
    const tx = { ...data, id: this.genId(), createdAt: new Date() };
    await this.collection("transactions").insertOne(tx);
    return tx;
  }

  async getUserTransactions(userId: string, limit = 50): Promise<any[]> {
    return await this.collection("transactions").find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  }

  async getAllTransactions(): Promise<any[]> {
    return await this.collection("transactions").find().sort({ createdAt: -1 }).toArray();
  }

  async createPayout(data: any): Promise<any> {
    const payout = { ...data, id: this.genId(), requestedAt: new Date() };
    await this.collection("payouts").insertOne(payout);
    return payout;
  }

  async getUserPayouts(userId: string): Promise<any[]> {
    return await this.collection("payouts").find({ userId }).sort({ requestedAt: -1 }).toArray();
  }

  async getAllPayouts(): Promise<any[]> {
    return await this.collection("payouts").find().sort({ requestedAt: -1 }).toArray();
  }

  async updatePayoutStatus(id: string, status: string): Promise<void> {
    await this.collection("payouts").updateOne({ id }, { $set: { status } });
  }

  async getPlatformRevenue(): Promise<any> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return await this.collection("platformRevenue").findOne({ month: currentMonth });
  }

  async createTip(data: any): Promise<any> {
    const tip = { ...data, id: this.genId(), createdAt: new Date() };
    await this.collection("tips").insertOne(tip);
    return tip;
  }

  async getStreamTips(streamId: string): Promise<any[]> {
    const docs = await this.collection("tips").find({ streamId }).sort({ createdAt: -1 }).toArray();
    return docs;
  }

  // Document transformers
  private docToUser(doc: any): User {
    return { ...doc, id: doc.id, createdAt: new Date(doc.createdAt), updatedAt: new Date(doc.updatedAt) } as User;
  }
  private docToTrack(doc: any): Track {
    return { ...doc, createdAt: new Date(doc.createdAt) } as Track;
  }
  private docToStream(doc: any): Stream {
    return { ...doc, createdAt: new Date(doc.createdAt) } as Stream;
  }
  private docToChatMessage(doc: any): ChatMessage {
    return { ...doc, createdAt: new Date(doc.createdAt) } as ChatMessage;
  }
  private docToSongRequest(doc: any): SongRequest {
    return { ...doc, requestedAt: new Date(doc.requestedAt) } as SongRequest;
  }
  private docToRoom(doc: any): Room {
    return { ...doc, createdAt: new Date(doc.createdAt) } as Room;
  }
}
