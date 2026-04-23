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

const worker = new Worker(
    "pdf_upload",
        async (job) => {
            console.log("✅ Job received:", job.data);

            const filePath = job.data.path;

            if (!filePath || !fs.existsSync(filePath)) {
                throw new Error("PDF file not found: " + filePath);
            }

            const loader = new PDFLoader(filePath);
            const docs = await loader.load();

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 500,
                chunkOverlap: 50,
            });

            const splitDocs = await splitter.splitDocuments(docs);

            const vectorStore = new MemoryVectorStore.fromDocuments(splitDocs, embeddings)

            // ✅ SAVE TO DISK
            await vectorStore.save("vectorstore");

            console.log("✅ Vector store saved to disk");

            return { success: true };
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
