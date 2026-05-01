import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

import { connection } from "./connection.js";

import { setVectorStore } from "./store.js";

import dotenv from "dotenv";
import { concat } from "@langchain/core/utils/stream";

dotenv.config();

// ================= EMBEDDINGS =================
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-embedding-001",
});

// ================= WORKER =================
const worker = new Worker(
  "upload_pdf",
   async (job) => {
    try {
      //Path of the file
      const { path : fileData } = job.data;

      console.log("📄 Processing file:", fileData);

    
      // 1. Load PDF
      const loader = new PDFLoader(fileData);
      const docs = await loader.load();

      // 2. Spliter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      //Split the docs
      const splitDocs = await splitter.splitDocuments(docs);

      // console.log(`Splited docs : ${splitDocs}`)

      // 3. Create vector store
      const vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        embeddings
      );

      //Retrive the vector text from vector store
      const retriever = vectorStore.asRetriever();
      setVectorStore(retriever)
      // console.log(await retriever.invoke("what is the docs about ?"));    

      return {
        success: true,
        chunks: splitDocs.length,
        jobId : job.id
      };

    } catch (err) {
      console.error("❌ Worker error:", err);
      throw err;
    }
  },
  {
    connection: connection,
  }
);

// ================= EVENTS =================
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});