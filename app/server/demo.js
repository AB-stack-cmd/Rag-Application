
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";
dotenv.config({ path: ".env", quiet: true });


async function testEmbedding() {
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY, // non-null assertion
        model: "gemini-embedding-001",
    });

    const vector = await embeddings.embedQuery("Hello Gemini embeddings");
    console.log("Embedded:", vector.length);
}

if (!process.env.GOOGLE_API_KEY) {
    console.log("null...")
} else {
    console.log("working...")
}

// console.log(process.env.GOOGLE_API_KEY);

// testEmbedding();
