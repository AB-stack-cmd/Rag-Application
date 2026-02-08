
import { Worker } from "bullmq";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env", quiet: true });
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

export const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-embedding-001",
});


// to convert normal text
// const vector = await embeddings.embedQuery("Hello Gemini embeddings")

// console.log("Embedded :", vector);


const worker = new Worker(
    "pdf_upload",
    async (job) => {
        console.log("✅ Job received:", job.data);
        console.log(Object.keys(job.data))
        console.log(typeof job.data.path === "string" ? "sting" : "not string")
        console.log("Job file Name:", job.data.filename);

        const filePath = job.data.path; // path of file
        console.log("File Path :", filePath);

        if (!filePath) {
            throw new Error("File path is missing");
        };

        // ✅ USE filePath
        const loader = new PDFLoader(filePath);
        const docs = await loader.load(); // load for chunk
        console.log("DOCS : ", docs[0])

        console.log("📄 Pages loaded :", docs.length);


        // text spilter
        const textsplitter = new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 0 })
        const splitDocs = await textsplitter.splitDocuments(docs);

        const clean_docs = splitDocs.filter(
            d => typeof d.pageContent === "string" &&
                d.pageContent.trim().length > 0
        );

        console.log("splitted docs :", splitDocs[0]);

        console.log("clean docs : ", clean_docs)

        const vectorstore = await MemoryVectorStore.fromDocuments(
            clean_docs,
            embeddings,
        );
        console.log("Vector stored : ", vectorstore)

        const retrivervectorstore = vectorstore.asRetriever(1);

        const retriveDoc = await retrivervectorstore.invoke("Give me brief about this pdf with key topics ?")
        console.log("Retrived answer : \n", retriveDoc)

        retriveDoc[0].pageContent;





        return { success: true };
    },
    {
        connection: {
            host: "localhost",
            port: 6379,
        },
        concurrency: 5,
    }
);

worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
});
