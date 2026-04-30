import IORedis from "ioredis";
import { Queue } from "bullmq";

// 🔥 Proper Redis connection
export const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null, // REQUIRED for BullMQ
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// 🔍 Debug (very useful)
connection.on("connect", () => {
  console.log("✅ Redis connected");
});

connection.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

connection.on("close", () => {
  console.warn("⚠️ Redis connection closed");
});

// 🔥 Clear queue name
export const pdfQueue = new Queue("upload_pdf", {
  connection,
});


export const testQueue = new Queue("demo", {
  connection,
});