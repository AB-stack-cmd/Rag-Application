import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

import { getVectorStore } from "./store.js";

import { ChatGoogleGenerativeAI,GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { pdfQueue } from "./connection.js";
import router from "./api/query_route.js";

import { QdrantVectorStore } from "@langchain/qdrant";

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

    console.log(`Job : ${job.id} ` )
  
 
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

    const { query :  query , jobId } = req.body;

    console.log(query)

    //Worker store the vector on setVectorStore
    const vectorStore = getVectorStore();
    if(!vectorStore){
      console.log("No vector Store")
    }
    console.log(vectorStore)

    // Retriver from the vectore text
    const retriever = vectorStore.retriever();
    if(!retriever){
      console.log()
    }
    // Query to restive relevent test from vector
    const  result = retriever.invoke(query)

    // Context
    const context = result.map(d => d.pageContent).join("\n\n");

    console.log(`Context : ${context}`)

    if (!vectorStore) {
      return res.status(400).json({
        error: "No document processed yet",
    });

     // 3. LLM
    const result = await llm.invoke(
      `Answer ONLY from this context:\n${context}\n\nQuestion: ${query}`
    );

    console.log(result)

     res.json({
      answer: result.content,
      chunksUsed: docs.length,
    });

    }}catch(error){
      res.json({
        error : "Vector error"
      })
    }
  
});

//======================== STATUS============================


app.get("/status/:id", async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await pdfQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        ready: false,
        status: "not_found",
      });
    }
    // Checks job state (completed or failed)
    const state = await job.getState();

    let result = null;

    if (state === "completed") {
      result = job.returnvalue; // worker return response
      console.log(result)
    }

    if (state === "failed") {
      return res.json({
        ready: false,
        status: "failed",
        error: job.failedReason,
      });
    }

    res.json({
      ready: true,
      jobId : job.id,
      result,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// route frpm api
app.use("/api", router);

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});