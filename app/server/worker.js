import { Worker, Queue } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantVectorStore } from "@langchain/qdrant";

import { connection } from "./connection.js";
import dotenv from "dotenv";

import { qdrantClient } from "./qdrant.js";
dotenv.config();


// ✅ FIXED embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-embedding-001",
});

// DLQ
const failedQueue = new Queue("failed_pdf", { connection });

const worker = new Worker(
  "upload_pdf",
  async (job) => {
    try {
      job.updateProgress(10);

      const { path: filePath } = job.data;

      console.log("📄 Processing:", filePath);

      // 1. Load PDF
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();

      job.updateProgress(30);

      // 2. Split
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 150,
      });

      const splitDocs = await splitter.splitDocuments(docs);

      job.updateProgress(60);

      // 3. Create unique collection per job
      const collectionName = job.id;

      // 4. Store vectors in Qdrant
      await QdrantVectorStore.fromDocuments(
        splitDocs,
        embeddings,
        {
          client:qdrantClient,
          collectionName,
        }
      );

      console.log("✅ Stored in Qdrant:", collectionName);

      job.updateProgress(100);

      return {
        success: true,
        collectionName,   //  (used by API)
        chunks: splitDocs.length,
      };

    } catch (err) {
      console.error("❌ Worker error:", err);

      await failedQueue.add("failed", {
        jobId: job.id,
        error: err.message,
      });

      throw err;
    }
  },
  { connection }
);

// EVENTS
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});