import express from "express";
import { testQueue } from "./connection.js";
import cors from  "cors"

const app = express();

// 🔥 Enable CORS (important)
app.use(cors({
  origin: "http://localhost:3000", // your frontend
  methods: ["GET", "POST"],
  credentials: true,
}));

// send job
app.get("/job", async (req, res) => {
  const job = await testQueue.add("demo", {
    name: "test-user",
  });
  console.log(job)
  console.log("📤 Job sent:", job.id);

  res.json({
    message: "Job added",
    jobId: job.id,
  });
});

app.listen(4000, () => {
  console.log("🚀 Server running on http://localhost:4000");
});