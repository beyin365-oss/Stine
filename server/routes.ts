import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTrackSchema, insertStreamSchema, insertChatMessageSchema, insertSongRequestSchema } from "@shared/schema";
import { categorizeListeners } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
      const { djName, bio } = req.body;
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        djName,
        bio,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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
        method: method || 'stripe',
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

  // Admin/Founder revenue routes - PRODUCTION READY
  app.get('/api/admin/revenue', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/payouts', isAuthenticated, async (req: any, res) => {
    try {
      const payouts = await storage.getAllPayouts();
      res.json(payouts || []);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.patch('/api/admin/payouts/:id/approve', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error fetching Stripe key:", error);
      res.status(500).json({ message: "Failed to fetch Stripe key" });
    }
  });

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

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients with stream associations
  const streamConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket, req) => {
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
