import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

import { getVectorStore } from "./store.js";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { pdfQueue } from "./connection.js";

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

    console.log(req.file)

    const job = await pdfQueue.add("upload_pdf",
      {
      filename : req.file.originalname,
      source : req.file.destination,
      path : req.file.path,
    });

    console.log(`Job : ${await job.getState("completed")}` )
 
    res.json({
      message: "Processed",
      jobId: job.id,
      ready:true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error:"Error from server" });
  }
});

// ================= QUERY =================
app.post("/query", async (req, res) => {
   try {

    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const { query :  query } = req.body;

    //Worker store the vector on setVectorStore
    const vectorStore = getVectorStore();

    // Retriver from the vectore text
    const retriever = vectorStore.retriever();
    // add query or promt to embedded model
    const  result = retriever.invoke(query)

    // Context
    const context = result.map(d => d.pageContent).join("\n\n");

    if (!vectorStore) {
      return res.status(400).json({
        error: "No document processed yet",
    });

     // 3. LLM
    const result = await llm.invoke(
      `Answer ONLY from this context:\n${context}\n\nQuestion: ${query}`
    );

     res.json({
      answer: result.content,
      chunksUsed: docs.length,
    });

    }}catch(error){
      res.json({
        error : "Server Error"
      })
    }
  
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});