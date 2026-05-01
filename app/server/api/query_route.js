import express from "express";
import { getVectorStore } from "../store.js";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";

import { pdfQueue } from "../connection.js";

const router = express.Router();

router.post("/query/:id", async (req, res) => {
  try {
    const jobId = req.params.id;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query required" });
    }

    console.log("📩 Query:", query);
    console.log("📦 JobId:", jobId);

    // 🔹 Get job
    const job = await pdfQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Invalid jobId" });
    }

    const state = await job.getState();

    if (state !== "completed") {
      return res.status(400).json({
        error: "Document not ready yet",
      });
    }

    const { collectionName } = job.returnvalue;

    // 🔹 Embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // 🔹 Load Qdrant collection
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        client: qdrantClient,
        collectionName,
      });

    // 🔹 Retriever
    const retriever = vectorStore.asRetriever(3);

    // 🔹 Get relevant docs
    const docs = await retriever.invoke(query);

    const context = docs.map((d) => d.pageContent).join("\n\n");

    console.log("📄 Context:", context.slice(0, 200));

    // 🔹 LLM
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const response = await llm.invoke(`
        Answer ONLY using this context.
        If answer not found, say "I don't know".

        Context:
        ${context}

        Question:
        ${query}
        `);

    res.json({
      answer: response.content,
      chunksUsed: docs.length,
    });

  } catch (error) {
    console.error("❌ Query error:", error);

    res.status(500).json({
      error: "Query failed",
    });
  }
});

export default router;