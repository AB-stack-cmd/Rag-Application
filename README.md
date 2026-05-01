This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.




# RAG PDF System (Queue + Worker + Qdrant + Gemini)

A scalable **Retrieval-Augmented Generation (RAG)** system for processing and querying PDF documents using asynchronous workers, vector search, and LLMs.

---

## 🧠 Overview

This system enables users to:

* Upload PDF documents
* Process them asynchronously (non-blocking)
* Generate embeddings and store them in a vector database
* Query documents using semantic search + LLM reasoning

The architecture is designed to be **modular, scalable, and production-ready**.

---

## 🏗️ Architecture

```
Client (Next.js)
      ↓
Express API (Upload / Query)
      ↓
BullMQ Queue (Redis)
      ↓
Worker (PDF → chunk → embedding)
      ↓
Qdrant (Vector Database)
      ↓
Retriever → LLM (Gemini)
      ↓
Response
```

---

## ⚙️ Tech Stack

| Layer      | Technology             |
| ---------- | ---------------------- |
| Backend    | Node.js, Express       |
| Queue      | BullMQ + Redis         |
| Vector DB  | Qdrant (Cloud / Local) |
| Embeddings | Google Generative AI   |
| LLM        | Gemini Flash           |
| Frontend   | Next.js                |

---

## 🔑 Core Design Decisions

### 1. Asynchronous Processing via Queue

PDF ingestion is CPU and I/O intensive. Offloading it to a worker:

* prevents API blocking
* enables horizontal scaling
* allows retry/failure handling

---

### 2. Worker Isolation

The worker runs in a **separate process**:

* avoids memory contention
* isolates failures
* allows independent scaling

---

### 3. Vector Database (Qdrant)

A dedicated vector database is used instead of in-memory storage:

* persistent storage
* multi-process accessibility
* efficient similarity search (HNSW indexing)

---

### 4. Collection-per-Document Strategy

Each uploaded document is stored in its own collection:

```js
const collectionName = `pdf_${job.id}`;
```

Benefits:

* document isolation
* simplified retrieval
* easier lifecycle management

---

## 📡 API Endpoints

### Upload PDF

```
POST /upload
```

**Response**

```json
{
  "jobId": "123"
}
```

---

### Check Job Status

```
GET /status/:id
```

**Response**

```json
{
  "status": "completed",
  "progress": 100,
  "result": {
    "collectionName": "pdf_123"
  }
}
```

---

### Query Document

```
POST /api/query/:id
```

**Body**

```json
{
  "query": "Explain the document"
}
```

**Response**

```json
{
  "answer": "Generated response...",
  "chunksUsed": 3
}
```

---

## ⚙️ Setup

### 1. Clone repository

```bash
git clone https://github.com/AB-stack-cmd/Rag-Application.git
cd Rad-Application
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Configure environment

Create a `.env` file:

```env
GOOGLE_API_KEY=your_google_api_key
QDRANT_URL=https://your-cluster.qdrant.tech
QDRANT_API_KEY=your_qdrant_api_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

### 4. Start Redis

```bash
docker run -p 6379:6379 redis
```

---

### 5. Start services

```bash
# API server
node app/server/server.js

# Worker (separate terminal)
node app/server/worker.js
```

```Run Frontend
npm run dev
---

## 🧪 Testing

### Upload

```bash
curl -X POST http://localhost:4000/upload \
  -F "pdf=@file.pdf"
```

---

### Query

```bash
curl -X POST http://localhost:4000/api/query/1 \
  -H "Content-Type: application/json" \
  -d '{"query":"Summarize the document"}'
```

---

## ⚠️ Common Failure Modes

### Embedding dimension mismatch

Ensure correct model:

```js
model: "models/embedding-001"
```

---

### Empty retrieval results

Check:

* worker completed successfully
* collection exists in Qdrant
* embeddings are non-empty

---

### JSON parsing errors (Windows)

Use proper escaping in PowerShell when using curl.

---

## 🔐 Security Considerations

* Validate file type and size during upload
* Sanitize file paths
* Do not expose API keys to client
* Add rate limiting for query endpoints
* Consider authentication for multi-user systems

---

## 🚀 Future Improvements

* Streaming responses (Server-Sent Events)
* Multi-document querying
* User-based document isolation
* Hybrid search (vector + keyword)
* Embedding caching to reduce cost
* UI support for source highlighting

---

## 🧠 Key Takeaways

This system demonstrates:

* asynchronous job processing
* vector-based information retrieval
* LLM integration in a production pattern

It is a solid foundation for building **AI-powered document systems at scale**.

---

## 📄 License

No License
