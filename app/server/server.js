import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { Query } from "./connection.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const file = path.join(process.cwd(),"/uploads")

let vectorStore = null;
let retriever = null;

// Embedding model
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-embedding-001",
});

// storage config
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.get("/status", async (req, res) => {
    if (!vectorStore && fs.existsSync("vectorstore")) {
        vectorStore = await FaissStore.load("vectorstore", embeddings);
        retriever = vectorStore.asRetriever(3);
    }

    res.json({ ready: Boolean(retriever) });
});

//Responding with output
app.post("/upload", async (req, res) => {

    // Data from client
    const { query } = req.body;

    upload_job = await Query.add("pdf_upload" , {query} )

    job_done = await upload_job.waitUntilFinished(queueEvents)

    console.log(query);
    
    if (!retriever) {
        return res.status(400).json({ error: "PDF not ready" });
    }

    const docs = await retriever.invoke(query);


    // LLM check 
    const context = docs.map(d => d.pageContent).join("\n\n");
    console.log(context)

    const llm = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-2.5-flash",
    });

    const result = await llm.invoke(`
        Answer ONLY from this context:

        ${context}

        Question: ${query}
    `);

    res.json({ answer: result.content });
});

app.listen(4000, () => {
    console.log("Server running on http://localhost:4000");
});
