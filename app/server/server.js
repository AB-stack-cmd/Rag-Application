import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

import { Query } from "./connection";

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ================= FILE SETUP =================
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage : storage });

// ================= UPLOAD =================
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const job = await Query.add("process-pdf", {
      filePath: req.file.path,
    });

    // Wait for completion (optional)
    const result = await job.waitUntilFinished(Query);

    res.json({
      message: "Processed",
      jobId: job.id,
      result,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ================= STATUS =================
app.get("/job/:id", async (req, res) => {
  const job = await pdfQueue.getJob(req.params.id);

  if (!job) return res.json({ status: "not found" });

  const state = await job.getState();

  res.json({ status: state });
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});