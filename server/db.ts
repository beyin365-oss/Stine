import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { MongoClient, Db } from 'mongodb';

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;

// 1. PostgreSQL (Neon / Render / local)
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log("PostgreSQL connected via DATABASE_URL");
}
// 2. MongoDB Atlas (MONGODB_URI)
else if (process.env.MONGODB_URI) {
  try {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db(process.env.MONGODB_DB_NAME || 'stine');
    console.log("MongoDB Atlas connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}
// 3. In-memory fallback
else {
  console.warn("No DATABASE_URL or MONGODB_URI set. Using in-memory storage fallback.");
}

export { pool, db, mongoClient, mongoDb };
