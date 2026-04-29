import { Worker } from "bullmq";
import { connection } from "./connection.js";

console.log("working...")

const worker = new Worker(
  "demo",
  async (job) => {
    console.log("📥 Worker received:", job.data);

    // simulate some work
    await new Promise((res) => setTimeout(res, 500));

    return {
      success: true,
      message: "Worker processed job",
    };
  },
  { connection:connection }
);

worker.on("completed", (job, result) => {
  console.log("✅ Completed:", result);
});

worker.on("failed", (job, err) => {
  console.error("❌ Failed:", err);
});