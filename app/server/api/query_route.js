import express from "express";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { pdfQueue } from "../connection.js";
import { qdrantClient } from "../qdrant.js";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ✅ embeddings (must match worker)
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-embedding-001",
});

// ================= QUERY =================
router.post("/query/:id", async (req, res) => {
  try {
    console.log("server working")
    const jobId = req.params.id;
    const { query } = req.body;

    // 1. Validate input
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // 2. Get job from queue
    const job = await pdfQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    // State from worker
    const state = await job.getState();

    if (state !== "completed") {
      return res.status(400).json({
        error: "PDF not processed yet",
        status: state,
      });
    }

    // 3. Get collection name from worker return
    const { collectionName } = job.returnvalue;

    if (!collectionName) {
      return res.status(500).json({
        error: "Collection not found (worker issue)",
      });
    }

    // 4. Load vector store (READ from Qdrant)
    const vectorStore =
      await QdrantVectorStore.fromExistingCollection(embeddings, {
        client: qdrantClient,
        collectionName,
      });

    const retriever = vectorStore.asRetriever({ k: 3 });

    // 5. Retrieve context
    const docs = await retriever.invoke(query);
    console.log(`Retriver : ${docs}`)

    if (!docs || docs.length === 0) {
      return res.json({
        answer: "No relevant context found in document.",
      });
    }

    const context = docs.map((d) => d.pageContent).join("\n\n");

    console.log("📄 Context retrieved:", context.slice(0, 200));

    // 6. LLM
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const result = await llm.invoke(
      `Answer ONLY from this context:\n${context}\n\nQuestion: ${query}`
    );

    console.log(`Result from query : ${result.content}`)
    // 7. Response
    res.json({
      answer: result.content,
      chunksUsed: docs.length,
      jobId,
    });

  } catch (err) {
    console.error("❌ Query error:", err);

    res.status(500).json({
      error: "Query failed",
      details: err.message,
    });
  }
});

export default router;