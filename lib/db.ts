import mongoose from "mongoose";
import dns from "dns";
import { createHash } from "node:crypto";

// আইএসপি ব্লকিং এড়াতে পাবলিক ডিএনএস আগে সেট করে নেওয়া হচ্ছে
dns.setServers(["1.1.1.1", "8.8.8.8"]);

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // বিল্ডের সময় এরর না দিয়ে, ডাটাবেস কানেক্ট করার সময় চেক করা হচ্ছে
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside the active Next.js environment configuration.",
    );
  }

  // Prevent a hot-reloaded development process from silently reusing a MongoDB
  // connection created with a different URI. Restart the server after changing
  // MONGODB_URI; never print or persist the URI itself.
  const uriFingerprint = createHash("sha256").update(MONGODB_URI).digest("hex");
  if (cached.uriFingerprint && cached.uriFingerprint !== uriFingerprint && (cached.conn || cached.promise)) {
    throw new Error("MONGODB_URI changed after the database connection was initialized. Restart the Next.js server to connect to the configured database.");
  }
  cached.uriFingerprint = uriFingerprint;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
