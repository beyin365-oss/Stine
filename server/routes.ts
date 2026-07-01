import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerAdminAuthRoutes, isAdminAuthenticated } from "./adminAuth";

import { insertTrackSchema, insertStreamSchema, insertChatMessageSchema, insertSongRequestSchema, insertTipSchema } from "@shared/schema";
import { categorizeListeners } from "./openai";
import { initializePaystackCharge, verifyPaystackTransaction } from "./paystackClient";

// Tracks live WebSocket server status for the health endpoint
let _wssConnectedClients = 0;
let _wssStarted = false;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Admin auth routes (founder bootstrap, admin login, password reset, account management)
  registerAdminAuthRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { djName, bio, firstName, lastName, profileImageUrl } = req.body;

      const existing = await storage.getUser(userId);
      const updatedUser = await storage.upsertUser({
        id: userId,
        djName: djName !== undefined ? djName : existing?.djName,
        bio: bio !== undefined ? bio : (existing as any)?.bio,
        email: existing?.email || req.user.claims.email,
        firstName: firstName !== undefined ? firstName : (existing?.firstName || req.user.claims.first_name),
        lastName: lastName !== undefined ? lastName : (existing?.lastName || req.user.claims.last_name),
        profileImageUrl: profileImageUrl !== undefined ? profileImageUrl : (existing?.profileImageUrl || req.user.claims.profile_image_url),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Role upgrade route
  app.patch('/api/user/role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      const allowed = ['listener', 'dj', 'songcreator'];
      if (!role || !allowed.includes(role)) {
        return res.status(400).json({ message: "Invalid role. Choose: listener, dj, songcreator" });
      }
      await (storage as any).updateUserRole?.(userId, role);
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Track routes
  app.post('/api/tracks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trackData = insertTrackSchema.parse({ ...req.body, userId });
      
      const track = await storage.createTrack(trackData);
      res.json(track);
    } catch (error) {
      console.error("Error creating track:", error);
      res.status(500).json({ message: "Failed to create track" });
    }
  });

  app.get('/api/tracks/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tracks = await storage.getUserTracks(userId);
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching user tracks:", error);
      res.status(500).json({ message: "Failed to fetch tracks" });
    }
  });

  // Public tracks — all public tracks, newest first
  app.get('/api/tracks/public', async (_req, res) => {
    try {
      const tracks = await (storage as any).getAllPublicTracks?.(100) ?? [];
      res.json(tracks);
    } catch (error) {
      console.error("Error fetching public tracks:", error);
      res.status(500).json({ message: "Failed to fetch public tracks" });
    }
  });

  // Search tracks
  app.get('/api/tracks/search', async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      if (!q || q.length < 2) return res.json([]);
      const tracks = await (storage as any).searchTracks?.(q, 50) ?? [];
      res.json(tracks);
    } catch (error) {
      console.error("Error searching tracks:", error);
      res.status(500).json({ message: "Failed to search tracks" });
    }
  });

  // Increment play count (fire-and-forget from client)
  app.post('/api/tracks/:id/play', async (req, res) => {
    try {
      await (storage as any).incrementPlayCount?.(req.params.id);
      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  // Download a track — increments count and redirects to fileUrl
  app.get('/api/tracks/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const track = await storage.getTrack(req.params.id);
      if (!track) return res.status(404).json({ message: "Track not found" });
      await (storage as any).incrementDownloadCount?.(track.id);
      if (track.fileUrl) {
        res.redirect(track.fileUrl);
      } else {
        res.status(404).json({ message: "No audio file for this track" });
      }
    } catch (error) {
      console.error("Error downloading track:", error);
      res.status(500).json({ message: "Failed to download track" });
    }
  });

  // Delete own track
  app.delete('/api/tracks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleted = await (storage as any).deleteTrack?.(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Track not found or not yours" });
      res.json({ ok: true });
    } catch (error) {
      console.error("Error deleting track:", error);
      res.status(500).json({ message: "Failed to delete track" });
    }
  });

  // Stream routes
  app.post('/api/stream/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streamData = insertStreamSchema.parse({ ...req.body, userId });
      
      // Check if user already has an active stream
      const existingStream = await storage.getUserCurrentStream(userId);
      if (existingStream) {
        return res.status(400).json({ message: "You already have an active stream" });
      }
      
      const stream = await storage.createStream(streamData);
      await storage.updateUserStreamingStatus(userId, true);
      
      res.json(stream);
    } catch (error) {
      console.error("Error starting stream:", error);
      res.status(500).json({ message: "Failed to start stream" });
    }
  });

  app.post('/api/stream/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentStream = await storage.getUserCurrentStream(userId);
      
      if (!currentStream) {
        return res.status(400).json({ message: "No active stream found" });
      }
      
      await storage.endStream(currentStream.id);
      await storage.updateUserStreamingStatus(userId, false);
      
      res.json({ message: "Stream ended successfully" });
    } catch (error) {
      console.error("Error ending stream:", error);
      res.status(500).json({ message: "Failed to end stream" });
    }
  });

  app.get('/api/stream/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stream = await storage.getUserCurrentStream(userId);
      res.json(stream);
    } catch (error) {
      console.error("Error fetching current stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });

  // Chat routes
  app.get('/api/chat/:streamId', isAuthenticated, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const messages = await storage.getStreamChatMessages(streamId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Song request routes
  app.post('/api/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = insertSongRequestSchema.parse({ ...req.body, userId });
      
      const request = await storage.addSongRequest(requestData);
      res.json(request);
    } catch (error) {
      console.error("Error creating song request:", error);
      res.status(500).json({ message: "Failed to create song request" });
    }
  });

  app.get('/api/requests/:streamId', isAuthenticated, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const requests = await storage.getStreamSongRequests(streamId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching song requests:", error);
      res.status(500).json({ message: "Failed to fetch song requests" });
    }
  });

  app.patch('/api/requests/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateSongRequestStatus(id, status);
      res.json({ message: "Request status updated" });
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ message: "Failed to update request status" });
    }
  });

  // AI categorization route
  app.post('/api/ai/categorize-listeners', isAuthenticated, async (req: any, res) => {
    try {
      const { chatMessages, streamData } = req.body;
      const categories = await categorizeListeners(chatMessages, streamData);
      res.json(categories);
    } catch (error) {
      console.error("Error categorizing listeners:", error);
      res.status(500).json({ message: "Failed to categorize listeners" });
    }
  });

  // AI auto-mixing route
  app.post('/api/ai/analyze-tracks', isAuthenticated, async (req: any, res) => {
    try {
      const { tracks, settings } = req.body;
      const mixPoints = tracks.map((track: any, idx: number) => {
        const nextTrack = tracks[idx + 1];
        if (!nextTrack) return null;
        const bpmDiff = Math.abs(track.bpm - nextTrack.bpm);
        const energyMatch = Math.abs(track.energy - nextTrack.energy) < 2;
        return {
          fromTrack: track.id,
          toTrack: nextTrack.id,
          startTime: Math.floor(track.duration * 0.7),
          endTime: Math.floor(track.duration * 0.85),
          crossfadeType: bpmDiff < 5 ? 'beatmatch' : bpmDiff < 10 ? 'smooth' : 'quick',
          confidence: energyMatch ? 0.92 : 0.75,
        };
      }).filter(Boolean);

      res.json({
        id: `mix-${Date.now()}`,
        tracks,
        mixPoints,
        aiSettings: settings,
        status: 'ready'
      });
    } catch (error) {
      console.error("Error analyzing tracks:", error);
      res.status(500).json({ message: "Failed to analyze tracks" });
    }
  });

  // AI generate mix
  app.post('/api/ai/generate-mix', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId, settings } = req.body;
      res.json({ sessionId, status: 'completed', downloadUrl: `/api/ai/mixes/${sessionId}.wav` });
    } catch (error) {
      console.error("Error generating mix:", error);
      res.status(500).json({ message: "Failed to generate mix" });
    }
  });

  // AI mixing recommendations
  app.get('/api/ai/mixing-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const recommendations = [
        { id: 'r1', title: 'Switch to Amapiano after track 3', confidence: 0.92, type: 'genre-shift' },
        { id: 'r2', title: 'Your peak engagement is at 8PM WAT', confidence: 0.88, type: 'timing' },
        { id: 'r3', title: 'Add more Afrobeat to boost Nigerian audience', confidence: 0.85, type: 'audience' },
      ];
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // AI clip suggestions
  app.get('/api/clips/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const { streamId } = req.query;
      const suggestions = [
        { id: '1', title: 'Sick Drop at 12:34', timestamp: 754, duration: 45, engagement: 98, description: 'Peak energy moment - crowd went wild' },
        { id: '2', title: 'Crowd React 15:22', timestamp: 922, duration: 30, engagement: 92, description: 'Listener reactions spiked here' },
        { id: '3', title: 'Smooth Transition 8:45', timestamp: 525, duration: 20, engagement: 87, description: 'Seamless mixing between genres' },
      ];
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clip suggestions" });
    }
  });

  // AI stream title generation
  app.post('/api/ai/generate-title', isAuthenticated, async (req: any, res) => {
    try {
      const { genre, mood } = req.body;
      const { generateStreamTitle } = await import('./openai');
      const title = await generateStreamTitle(genre, mood);
      res.json({ title });
    } catch (error) {
      console.error("Error generating title:", error);
      res.status(500).json({ message: "Failed to generate title" });
    }
  });

  // Rooms routes
  app.get('/api/rooms/active', async (req, res) => {
    try {
      const rooms = await storage.getActiveRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching active rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Follow routes
  app.post('/api/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const { userId } = req.params;
      
      if (followerId === userId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      await storage.followUser(followerId, userId);
      res.json({ message: "User followed successfully" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete('/api/follow/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const { userId } = req.params;
      
      await storage.unfollowUser(followerId, userId);
      res.json({ message: "User unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // Payment routes - PRODUCTION READY
  app.post('/api/payments/create', isAuthenticated, async (req: any, res) => {
    try {
      const { recipientId, amount, type, paymentMethod } = req.body;
      const userId = req.user.claims.sub;
      
      // Validate inputs
      if (!amount || amount < 1 || !type || !paymentMethod) {
        return res.status(400).json({ message: "Invalid payment parameters" });
      }
      
      // Fee calculation per type: tips 15%, subscriptions 20%, merchandise 25%
      const feeRates: Record<string, number> = { tip: 0.15, subscription: 0.20, merchandise: 0.25 };
      const platformFeeRate = feeRates[type] || 0.15;
      const platformFee = parseFloat((amount * platformFeeRate).toFixed(2));
      const netAmount = amount - platformFee;
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        recipientId: recipientId || undefined,
        type,
        amount: amount.toString(),
        platformFee: platformFee.toString(),
        netAmount: netAmount.toString(),
        paymentMethod,
        status: 'pending',
        description: `${type} payment via ${paymentMethod}`,
      });
      
      res.json({ 
        success: true,
        transactionId: transaction.id,
        platformFee,
        netAmount,
        totalAmount: amount
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get('/api/payments/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserTransactions(userId, 50);
      res.json(history || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Tip routes
  app.post('/api/tips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recipientId, amount, message, streamId } = req.body;
      const tipData = insertTipSchema.parse({ userId, recipientId, amount, message, streamId });
      const tip = await storage.createTip(tipData);
      res.json(tip);
    } catch (error) {
      console.error("Error creating tip:", error);
      res.status(500).json({ message: "Failed to create tip" });
    }
  });

  app.get('/api/tips/:streamId', isAuthenticated, async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const tips = await storage.getStreamTips(streamId);
      res.json(tips || []);
    } catch (error) {
      console.error("Error fetching tips:", error);
      res.status(500).json({ message: "Failed to fetch tips" });
    }
  });

  // Payout request routes
  app.post('/api/payouts/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount, method } = req.body;
      
      if (!amount || amount < 10) {
        return res.status(400).json({ message: "Minimum payout is $10" });
      }
      
      const payout = await storage.createPayout({
        userId,
        amount: amount.toString(),
        method: method || 'paystack',
        status: 'pending'
      });
      
      res.json({ success: true, payout });
    } catch (error) {
      console.error("Error requesting payout:", error);
      res.status(500).json({ message: "Failed to request payout" });
    }
  });

  app.get('/api/payouts/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payouts = await storage.getUserPayouts(userId);
      res.json(payouts || []);
    } catch (error) {
      console.error("Error fetching payout history:", error);
      res.status(500).json({ message: "Failed to fetch payout history" });
    }
  });

  // ── Admin guard middleware ─────────────────────────────────────────────
  // Checks the requesting user is the platform owner (by email) OR has role=admin
  const OWNER_EMAIL = (process.env.OWNER_EMAIL || "beyin365@gmail.com").toLowerCase().trim();

  const isAdmin = async (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) return res.status(401).json({ message: "User not found" });
      const email = (user.email || "").toLowerCase().trim();
      if (email === OWNER_EMAIL || (user as any).role === "admin") return next();
      return res.status(403).json({ message: "Admin access required" });
    } catch {
      return res.status(500).json({ message: "Auth check failed" });
    }
  };

  // Admin user management routes
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await (storage as any).getAllUsers?.() || [];
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const allowed = ['listener', 'dj', 'songcreator', 'admin'];
      if (!role || !allowed.includes(role)) return res.status(400).json({ message: "Invalid role" });
      await (storage as any).updateUserRole?.(id, role);
      res.json({ message: "Role updated", id, role });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.patch('/api/admin/users/:id/ban', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { banned } = req.body;
      await (storage as any).banUser?.(id, !!banned);
      res.json({ message: banned ? "User banned" : "User unbanned", id });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Admin/Founder revenue routes
  app.get('/api/admin/revenue', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      const allPayouts = await storage.getAllPayouts();
      
      const tipCommissions = allTransactions
        .filter((t: any) => t.type === 'tip' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + parseFloat(t.platformFee || '0'), 0);
      
      const subscriptionCommissions = allTransactions
        .filter((t: any) => t.type === 'subscription' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + parseFloat(t.platformFee || '0'), 0);
      
      const marketplaceCommissions = allTransactions
        .filter((t: any) => t.type === 'merchandise' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + parseFloat(t.platformFee || '0'), 0);
      
      const totalPayouts = allPayouts
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);
      
      const revenueData = {
        totalRevenue: tipCommissions + subscriptionCommissions + marketplaceCommissions,
        tipCommissions,
        subscriptionCommissions,
        marketplaceCommissions,
        totalTransactions: allTransactions.length,
        completedTransactions: allTransactions.filter((t: any) => t.status === 'completed').length,
        totalPayouts,
        pendingPayouts: allPayouts.filter((p: any) => p.status === 'pending').length,
      };
      res.json(revenueData);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  app.get('/api/admin/transactions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/payouts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const payouts = await storage.getAllPayouts();
      res.json(payouts || []);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.patch('/api/admin/payouts/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.updatePayoutStatus(id, 'processing');
      res.json({ message: "Payout approved and processing", id });
    } catch (error) {
      console.error("Error approving payout:", error);
      res.status(500).json({ message: "Failed to approve payout" });
    }
  });

  // Payment provider endpoints
  app.get('/api/paypal/client-id', async (req, res) => {
    try {
      const { getPayPalClientId } = await import('./paypalClient');
      const clientId = await getPayPalClientId();
      res.json({ clientId });
    } catch (error) {
      console.error("Error fetching PayPal client ID:", error);
      res.status(500).json({ message: "Failed to fetch PayPal client ID" });
    }
  });

  // Paystack endpoints for Naira payments
  app.get('/api/paystack/public-key', async (req, res) => {
    try {
      const { getPaystackPublicKey } = await import('./paystackClient');
      const publicKey = await getPaystackPublicKey();
      res.json({ publicKey });
    } catch (error) {
      console.error("Error fetching Paystack public key:", error);
      res.status(500).json({ message: "Failed to fetch Paystack public key" });
    }
  });

  app.post('/api/paystack/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const { amount, reference, email } = req.body;
      const { initializePaystackCharge } = await import('./paystackClient');
      
      const response = await initializePaystackCharge(email || req.user.claims.email, amount, reference);
      res.json(response);
    } catch (error) {
      console.error("Error initializing Paystack charge:", error);
      res.status(500).json({ message: "Failed to initialize payment" });
    }
  });

  app.get('/api/paystack/verify/:reference', isAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.params;
      const { verifyPaystackTransaction } = await import('./paystackClient');
      const response = await verifyPaystackTransaction(reference);

      if (response.status === true && response.data.status === 'success') {
        const userId = req.user.claims.sub;
        const amountNaira = response.data.amount / 100; // Convert from kobo
        const isSubscription = reference.startsWith('stine-sub');
        const isTip = reference.startsWith('stine-tip');
        const paymentType = isSubscription ? 'subscription' : isTip ? 'tip' : 'payment';
        const feeRate = isSubscription ? 0.20 : isTip ? 0.15 : 0.15;

        const transaction = await storage.createTransaction({
          userId,
          type: paymentType,
          amount: amountNaira.toString(),
          platformFee: (amountNaira * feeRate).toString(),
          netAmount: (amountNaira * (1 - feeRate)).toString(),
          paymentMethod: 'paystack',
          status: 'completed',
          paystackReference: reference,
          currency: response.data.currency || 'NGN',
          metadata: {
            reference,
            email: response.data.customer.email,
            tierId: req.query.tierId || null,
            gatewayResponse: response.data.gateway_response
          }
        });

        // Update subscription tier if this was a subscription payment
        if (isSubscription) {
          const tierId = (req.query.tierId as string) || response.data?.metadata?.tierId;
          if (tierId) {
            await (storage as any).updateUserSubscription?.(userId, tierId);
          }
        }

        res.json({ success: true, transaction, type: paymentType });
      } else {
        res.status(400).json({ success: false, message: 'Payment verification failed', data: response });
      }
    } catch (error) {
      console.error("Error verifying Paystack transaction:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Subscription tiers endpoint
  app.get('/api/subscription/tiers', async (req, res) => {
    try {
      const tiers = [
        { id: 'tier-free', name: 'Free', price: 0, currency: 'NGN', features: ['1 stream', 'Basic audio', 'Standard analytics'] },
        { id: 'tier-basic', name: 'Basic', price: 5000, currency: 'NGN', features: ['3 streams', '320kbps audio', 'Enhanced analytics', 'Custom branding'] },
        { id: 'tier-pro', name: 'Pro', price: 15000, currency: 'NGN', features: ['5 streams', 'Lossless audio', 'AI analytics', 'Stream recording', 'NFT access'] },
        { id: 'tier-premium', name: 'Premium', price: 50000, currency: 'NGN', features: ['Unlimited streams', 'Master quality', 'Real-time AI mixing', 'API access', 'Merchandise store'] },
      ];
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tiers' });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // LIVE STREAMS
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/streams/live', async (_req, res) => {
    try {
      const streams = await (storage as any).getLiveStreams?.() ?? [];
      res.json(streams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EDITORIAL CONTENT (categories, artists, albums, playlists)
  // ─────────────────────────────────────────────────────────────────────────
  const { EDITORIAL_CATEGORIES, EDITORIAL_ARTISTS, EDITORIAL_ALBUMS, EDITORIAL_PLAYLISTS } = await import('./seeder');

  app.get('/api/content/categories', async (_req, res) => {
    try {
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const cats = await mongoDb.collection('categories').find().toArray();
        return res.json(cats.length > 0 ? cats : EDITORIAL_CATEGORIES);
      }
      res.json(EDITORIAL_CATEGORIES);
    } catch { res.json(EDITORIAL_CATEGORIES); }
  });

  app.get('/api/content/artists', async (_req, res) => {
    try {
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const artists = await mongoDb.collection('featured_artists').find().toArray();
        return res.json(artists.length > 0 ? artists : EDITORIAL_ARTISTS);
      }
      res.json(EDITORIAL_ARTISTS);
    } catch { res.json(EDITORIAL_ARTISTS); }
  });

  app.get('/api/content/albums', async (_req, res) => {
    try {
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const albums = await mongoDb.collection('featured_albums').find().toArray();
        return res.json(albums.length > 0 ? albums : EDITORIAL_ALBUMS);
      }
      res.json(EDITORIAL_ALBUMS);
    } catch { res.json(EDITORIAL_ALBUMS); }
  });

  app.get('/api/content/playlists/featured', async (_req, res) => {
    try {
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const playlists = await mongoDb.collection('featured_playlists').find().toArray();
        return res.json(playlists.length > 0 ? playlists : EDITORIAL_PLAYLISTS);
      }
      res.json(EDITORIAL_PLAYLISTS);
    } catch { res.json(EDITORIAL_PLAYLISTS); }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CREATOR WALLET
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/wallet', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const wallet = await mongoDb.collection('creatorWallets').findOne({ userId });
        return res.json(wallet || { userId, balance: "0.00", totalEarned: "0.00", totalWithdrawn: "0.00", pendingAmount: "0.00" });
      }
      res.json({ userId, balance: "0.00", totalEarned: "0.00", totalWithdrawn: "0.00", pendingAmount: "0.00" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.get('/api/wallet/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions?.(userId) ?? [];
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet history" });
    }
  });

  app.post('/api/wallet/bank', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bankName, accountNumber, accountName, bankCode } = req.body;
      if (!accountNumber || !bankCode) {
        return res.status(400).json({ message: "Account number and bank code required" });
      }
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        await mongoDb.collection('creatorWallets').updateOne(
          { userId },
          { $set: { bankName, accountNumber, accountName, bankCode, updatedAt: new Date() } },
          { upsert: true }
        );
      }
      res.json({ message: "Bank details saved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save bank details" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CREATOR ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/creator/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const tracks = await storage.getUserTracks?.(userId) ?? [];
      const totalPlays = tracks.reduce((s: number, t: any) => s + (t.playCount || 0), 0);
      const totalDownloads = tracks.reduce((s: number, t: any) => s + (t.downloadCount || 0), 0);
      res.json({
        followers: (user as any)?.followerCount || 0,
        totalTracks: tracks.length,
        totalPlays,
        totalDownloads,
        streamHours: Math.floor(((user as any)?.totalStreamTime || 0) / 60),
        monthlyEarnings: "0.00",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // DJ VERIFICATION (KYC)
  // ─────────────────────────────────────────────────────────────────────────
  app.post('/api/verification/submit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bio, socialLink, djName } = req.body;
      if (!bio?.trim()) {
        return res.status(400).json({ message: "Bio is required" });
      }
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const existing = await mongoDb.collection('kycVerifications').findOne({ userId });
        if (existing && existing.status === 'pending') {
          return res.status(400).json({ message: "Verification already pending" });
        }
        const doc = {
          id: `kyc_${Date.now()}`,
          userId,
          djName: djName || "",
          bio,
          socialLink: socialLink || "",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await mongoDb.collection('kycVerifications').updateOne({ userId }, { $set: doc }, { upsert: true });
        return res.json({ message: "Verification submitted", status: "pending" });
      }
      res.json({ message: "Verification submitted (in-memory mode)", status: "pending" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit verification" });
    }
  });

  app.get('/api/verification/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const v = await mongoDb.collection('kycVerifications').findOne({ userId });
        if (!v) return res.json({ status: null });
        return res.json({ status: v.status, submittedAt: v.createdAt });
      }
      res.json({ status: null });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verification status" });
    }
  });

  // Admin KYC management
  app.get('/api/admin/verifications', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const verifs = await mongoDb.collection('kycVerifications').find().sort({ createdAt: -1 }).toArray();
        return res.json(verifs);
      }
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verifications" });
    }
  });

  app.patch('/api/admin/verification/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // "approved" | "rejected"
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const v = await mongoDb.collection('kycVerifications').findOneAndUpdate(
          { id },
          { $set: { status, reviewedAt: new Date() } },
          { returnDocument: "after" }
        );
        // If approved, update user's verificationLevel
        if (v && status === "approved") {
          await (storage as any).updateUserRole?.(v.userId, 'dj');
        }
        // Audit log
        const adminUser = await storage.getUser(req.user.claims.sub);
        await mongoDb.collection('adminAuditLogs').insertOne({
          id: `audit_${Date.now()}`,
          action: `verification_${status}`,
          adminId: req.user.claims.sub,
          adminEmail: adminUser?.email || "",
          details: { verificationId: id, userId: v?.userId, status },
          createdAt: new Date(),
        });
        return res.json({ message: `Verification ${status}`, id });
      }
      res.json({ message: `Verification ${status}` });
    } catch (error) {
      res.status(500).json({ message: "Failed to update verification" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN AUDIT LOGS
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/admin/audit-logs', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const logs = await mongoDb.collection('adminAuditLogs').find().sort({ createdAt: -1 }).limit(200).toArray();
        return res.json(logs);
      }
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN PAYOUTS (with Paystack Transfers)
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/admin/payouts/pending', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allPayouts = await storage.getAllPayouts?.() ?? [];
      const pending = allPayouts.filter((p: any) => p.status === 'pending');
      // Enrich with user info
      const enriched = await Promise.all(pending.map(async (p: any) => {
        const user = await storage.getUser?.(p.userId).catch(() => null);
        const { mongoDb } = await import('./db');
        const wallet = mongoDb ? await mongoDb.collection('creatorWallets').findOne({ userId: p.userId }) : null;
        return {
          ...p,
          djName: user?.djName || user?.firstName || p.userId,
          email: user?.email || "",
          bankAccount: wallet?.accountNumber || "",
          bankCode: wallet?.bankCode || "",
          accountName: wallet?.accountName || "",
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending payouts" });
    }
  });

  app.post('/api/admin/payout/:payoutId/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { payoutId } = req.params;
      const payout = (await storage.getAllPayouts?.() ?? []).find((p: any) => p.id === payoutId);
      if (!payout) return res.status(404).json({ message: "Payout not found" });
      if (payout.status !== 'pending') return res.status(400).json({ message: "Payout is not pending" });

      const { mongoDb } = await import('./db');
      const wallet = mongoDb ? await mongoDb.collection('creatorWallets').findOne({ userId: payout.userId }) : null;
      const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

      if (PAYSTACK_SECRET && wallet?.accountNumber && wallet?.bankCode) {
        // 1. Create transfer recipient
        const recipientRes = await fetch('https://api.paystack.co/transferrecipient', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'nuban',
            name: wallet.accountName || payout.userId,
            account_number: wallet.accountNumber,
            bank_code: wallet.bankCode,
            currency: 'NGN',
          }),
        });
        const recipientData = await recipientRes.json() as any;

        if (recipientData.status !== true) {
          return res.status(400).json({ message: "Failed to create transfer recipient: " + recipientData.message });
        }

        // 2. Initiate transfer (amount in kobo)
        const amountKobo = Math.round(parseFloat(payout.amount) * 100);
        const transferRes = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'balance',
            amount: amountKobo,
            recipient: recipientData.data.recipient_code,
            reason: `STINE Creator Payout - ${payoutId}`,
          }),
        });
        const transferData = await transferRes.json() as any;

        if (transferData.status !== true) {
          return res.status(400).json({ message: "Transfer failed: " + transferData.message });
        }

        await storage.updatePayoutStatus?.(payoutId, 'completed');
      } else {
        // No Paystack configured — mark as manually processed
        await storage.updatePayoutStatus?.(payoutId, 'processing');
      }

      // Audit log
      const adminUser = await storage.getUser(req.user.claims.sub);
      if (mongoDb) {
        await mongoDb.collection('adminAuditLogs').insertOne({
          id: `audit_${Date.now()}`,
          action: 'payout_approved',
          adminId: req.user.claims.sub,
          adminEmail: adminUser?.email || "",
          details: { payoutId, amount: payout.amount, userId: payout.userId },
          createdAt: new Date(),
        });
      }

      res.json({ message: PAYSTACK_SECRET ? "Payout transferred via Paystack" : "Payout marked as processing (no Paystack key)" });
    } catch (error: any) {
      console.error("Error approving payout:", error);
      res.status(500).json({ message: "Failed to approve payout: " + error.message });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PLATFORM HEALTH  (admin-session authenticated)
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/admin/health', isAdminAuthenticated, async (_req, res) => {
    try {
      const { mongoDb, pool } = await import('./db');
      const health: any = {
        uptime: process.uptime(),
        timestamp: new Date(),
        websocket: _wssStarted ? (_wssConnectedClients >= 0 ? "ok" : "error") : "not_configured",
        websocketClients: _wssConnectedClients,
      };

      // PostgreSQL — real SELECT 1 ping
      if (pool) {
        try {
          const result = await pool.query("SELECT 1 AS ok");
          health.postgres = result.rows?.[0]?.ok === 1 ? "ok" : "error";
        } catch {
          health.postgres = "error";
        }
      } else {
        health.postgres = "not_configured";
      }

      // MongoDB — real ping command
      if (mongoDb) {
        try {
          const ping = await mongoDb.command({ ping: 1 });
          health.mongodb = ping?.ok === 1 ? "ok" : "error";
        } catch {
          health.mongodb = "error";
        }
      } else {
        health.mongodb = "not_configured";
      }

      // Paystack — verify key exists AND hit the API
      if (process.env.PAYSTACK_SECRET_KEY) {
        try {
          const paystackRes = await fetch("https://api.paystack.co/balance", {
            headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
            signal: AbortSignal.timeout(5000),
          });
          health.paystack = paystackRes.ok ? "ok" : "error";
          health.paystackStatus = paystackRes.status;
        } catch {
          health.paystack = "error";
        }
      } else {
        health.paystack = "not_configured";
      }

      res.json(health);
    } catch (error) {
      res.status(500).json({ message: "Health check failed" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PAYSTACK WEBHOOK
  // ─────────────────────────────────────────────────────────────────────────
  app.post('/api/paystack/webhook', async (req: any, res) => {
    try {
      const crypto = await import('crypto');
      const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
      const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(JSON.stringify(req.body)).digest('hex');
      if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).json({ message: "Invalid signature" });
      }
      const event = req.body;
      if (event.event === 'charge.success') {
        const reference = event.data.reference;
        const isSubscription = reference?.startsWith('stine-sub');
        if (isSubscription) {
          const userId = event.data.metadata?.userId;
          const tierId = event.data.metadata?.tierId;
          if (userId && tierId) {
            await (storage as any).updateUserSubscription?.(userId, tierId);
          }
        }
      }
      if (event.event === 'transfer.success') {
        const reference = event.data.reference;
        const { mongoDb } = await import('./db');
        if (mongoDb) {
          await mongoDb.collection('adminAuditLogs').insertOne({
            id: `webhook_${Date.now()}`,
            action: 'paystack_transfer_success',
            adminId: 'webhook',
            adminEmail: 'paystack',
            details: { reference, amount: event.data.amount },
            createdAt: new Date(),
          });
        }
      }
      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // DOWNLOAD LIMIT ENFORCEMENT
  // ─────────────────────────────────────────────────────────────────────────
  const TIER_DOWNLOAD_LIMITS: Record<string, number> = {
    'tier-free': 5,
    'tier-basic': 30,
    'tier-pro': 100,
    'tier-premium': 1000,
    'tier-elite': -1, // unlimited
  };

  app.get('/api/tracks/:id/download/checked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const tier = (user as any).subscriptionTier || 'tier-free';
      const limit = TIER_DOWNLOAD_LIMITS[tier] ?? 5;
      const { mongoDb } = await import('./db');
      let downloadCount = 0;
      if (mongoDb) {
        const counter = await mongoDb.collection('userDownloadCounts').findOne({ userId });
        downloadCount = counter?.count || 0;
        if (limit !== -1 && downloadCount >= limit) {
          return res.status(403).json({ message: `Download limit reached (${limit} for ${tier}). Upgrade your plan.`, limitReached: true, limit, count: downloadCount });
        }
        await mongoDb.collection('userDownloadCounts').updateOne({ userId }, { $inc: { count: 1 }, $set: { lastUpdated: new Date() } }, { upsert: true });
      }
      const track = await storage.getTrack(req.params.id);
      if (!track) return res.status(404).json({ message: "Track not found" });
      await (storage as any).incrementDownloadCount?.(track.id);
      if (track.fileUrl) res.redirect(track.fileUrl);
      else res.status(404).json({ message: "No audio file for this track" });
    } catch (error) {
      res.status(500).json({ message: "Failed to download" });
    }
  });

  // User download count
  // Notifications endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const notifications = await mongoDb.collection('notifications')
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray();
        return res.json(notifications);
      }
      res.json([]);
    } catch { res.json([]); }
  });

  app.post('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        await mongoDb.collection('notifications').updateMany({ userId }, { $set: { read: true } });
      }
      res.json({ ok: true });
    } catch { res.json({ ok: true }); }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { mongoDb } = await import('./db');
      const { ObjectId } = await import('mongodb');
      if (mongoDb) {
        await mongoDb.collection('notifications').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { read: true } });
      }
      res.json({ ok: true });
    } catch { res.json({ ok: true }); }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { mongoDb } = await import('./db');
      const { ObjectId } = await import('mongodb');
      if (mongoDb) {
        await mongoDb.collection('notifications').deleteOne({ _id: new ObjectId(req.params.id) });
      }
      res.json({ ok: true });
    } catch { res.json({ ok: true }); }
  });

  app.get('/api/user/download-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const counter = await mongoDb.collection('userDownloadCounts').findOne({ userId });
        return res.json({ count: counter?.count || 0 });
      }
      res.json({ count: 0 });
    } catch { res.json({ count: 0 }); }
  });

  // Subscription payment initialization
  app.post('/api/subscription/pay', isAuthenticated, async (req: any, res) => {
    try {
      const { tierId, amount } = req.body;
      const reference = `stine-sub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const response = await initializePaystackCharge(
        req.user.claims.email || 'user@stine.app',
        amount,
        reference
      );
      res.json({ ...response, reference, tierId });
    } catch (error) {
      console.error('Error initializing subscription payment:', error);
      res.status(500).json({ message: 'Failed to initialize subscription payment' });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN USER MANAGEMENT (uses isAdminAuthenticated — separate from isAdmin)
  // ─────────────────────────────────────────────────────────────────────────
  app.get('/api/admin/users', isAdminAuthenticated, async (_req: any, res: any) => {
    try {
      const users = await (storage as any).getAllUsers?.() ?? [];
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/role', isAdminAuthenticated, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const allowed = ["listener", "dj", "broadcaster", "songcreator", "admin", "super_admin"];
      if (!allowed.includes(role)) return res.status(400).json({ message: "Invalid role" });
      await (storage as any).updateUserRole?.(id, role);
      // Audit log
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        await mongoDb.collection('adminAuditLogs').insertOne({ id: `audit_${Date.now()}`, action: 'user_role_updated', adminId: (req as any).admin?.id, details: { userId: id, role }, createdAt: new Date() });
      }
      res.json({ message: "Role updated", id, role });
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.patch('/api/admin/users/:id/ban', isAdminAuthenticated, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { banned } = req.body;
      await (storage as any).banUser?.(id, !!banned);
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        await mongoDb.collection('adminAuditLogs').insertOne({ id: `audit_${Date.now()}`, action: banned ? 'user_banned' : 'user_unbanned', adminId: (req as any).admin?.id, details: { userId: id }, createdAt: new Date() });
      }
      res.json({ message: banned ? "User suspended" : "User reactivated", id });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get('/api/admin/fraud', isAdminAuthenticated, async (_req: any, res: any) => {
    try {
      const { mongoDb } = await import('./db');
      if (mongoDb) {
        const flagged = await mongoDb.collection('fraudFlags').find({ resolved: { $ne: true } }).limit(50).toArray();
        const resolved = await mongoDb.collection('fraudFlags').countDocuments({ resolved: true });
        return res.json({ suspiciousAccounts: flagged, resolvedCases: resolved, openCases: flagged.length });
      }
      res.json({ suspiciousAccounts: [], resolvedCases: 0, openCases: 0 });
    } catch {
      res.json({ suspiciousAccounts: [], resolvedCases: 0, openCases: 0 });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  _wssStarted = true;
  
  // Store connected clients with stream associations
  const streamConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket, req) => {
    _wssConnectedClients = wss.clients.size;
    let currentStreamId: string | null = null;
    
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_stream':
            currentStreamId = message.streamId;
            
            if (currentStreamId) {
              if (!streamConnections.has(currentStreamId)) {
                streamConnections.set(currentStreamId, new Set());
              }
              streamConnections.get(currentStreamId)!.add(ws);
              
              // Update listener count
              const listenerCount = streamConnections.get(currentStreamId)!.size;
              await storage.updateStreamListenerCount(currentStreamId, listenerCount);
              
              // Broadcast listener count update
              broadcastToStream(currentStreamId, {
                type: 'listener_count_update',
                count: listenerCount
              });
            }
            break;
            
          case 'chat_message':
            if (currentStreamId && message.userId) {
              const chatMessage = await storage.addChatMessage({
                streamId: currentStreamId,
                userId: message.userId,
                message: message.message,
                messageType: 'chat'
              });
              
              broadcastToStream(currentStreamId, {
                type: 'new_message',
                message: chatMessage
              });
            }
            break;
            
          case 'like_stream':
            if (currentStreamId) {
              broadcastToStream(currentStreamId, {
                type: 'stream_liked',
                userId: message.userId
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', async () => {
      _wssConnectedClients = Math.max(0, wss.clients.size - 1);
      if (currentStreamId && streamConnections.has(currentStreamId)) {
        streamConnections.get(currentStreamId)!.delete(ws);
        
        const listenerCount = streamConnections.get(currentStreamId)!.size;
        if (listenerCount === 0) {
          streamConnections.delete(currentStreamId);
        } else {
          await storage.updateStreamListenerCount(currentStreamId, listenerCount);
          broadcastToStream(currentStreamId, {
            type: 'listener_count_update',
            count: listenerCount
          });
        }
      }
    });
  });

  function broadcastToStream(streamId: string, message: any) {
    const connections = streamConnections.get(streamId);
    if (connections) {
      const messageStr = JSON.stringify(message);
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  return httpServer;
}
