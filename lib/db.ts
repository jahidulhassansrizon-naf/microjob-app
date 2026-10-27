import mongoose from "mongoose";
import dns from "dns";

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
      "Please define the MONGODB_URI environment variable inside .env.local",
    );
  }

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
