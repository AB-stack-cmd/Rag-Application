import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-embedding-001",
});


// Worker for pdf
const worker = new Worker(
  "query-queue",
     async (job) => {
        const { query } = job.data;

        const retriever = await initRetriever();

        const docs = await retriever.invoke(query);
        const context = docs.map(d => d.pageContent).join("\n\n");

        const llm = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-2.5-flash",
        });

        const result = await llm.invoke(`
            Answer ONLY from this context:

            ${context}

            Question: ${query}
            `);

        return {
            answer: result.content,
            success : true
            };
    },
        {
            connection: { host: "localhost", port: 6379 },
        }
);

worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err);
});
