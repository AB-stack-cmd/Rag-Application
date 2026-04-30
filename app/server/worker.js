import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

import { connection } from "./connection.js";

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
      const { fileData } = job.data;

      // const filePath = fileData.path;
      // console.log(filePath)

      console.log(job.data.path)

      console.log("📄 Processing file:", fileData);

    
      // 1. Load PDF
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();

      // 2. Split text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      //docs with split
      const splitDocs = await splitter.splitDocuments(docs);

      console.log(`Splited docs : ${splitDocs}`)

      // 3. Create vector store
      const vectorStore = await MemoryVectorStore.fromDocuments(
        splitDocs,
        embeddings
      );

      const retriever = vectorStore.asRetriever(3);
      console.log(`Rretriver : ${retriever}`)
      
//////////////////////////////////////////////////////////
      // 4. Create retriever (optional return info)
      // const retriever = vectorStore.asRetriever(3);
      // console.log()
      

      // console.log("✅ PDF processed successfully");
      // console.log(retriever)

      // // Call llm
      // const llm = new ChatGoogleGenerativeAI({
      //   model :"gemini-2.5-flash",
      //   apiKey:process.env.GOOGLE_API_KEY
      // })

      // // LLM result
      // const result = await llm.invoke(` Answer ONLY from this context: ${context} Question: ${query}` );

      // return {
      //   success: true,
      //   chunks: splitDocs.length,
      // };
//////////////////////////////////////////////////////////
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