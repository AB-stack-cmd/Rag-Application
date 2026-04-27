import { Redis } from "ioredis";
import { Queue } from "bullmq";

export const connection = new Redis({
    host: "127.0.0.1",
    port: 6379
})

// Queue for worker
export const Query = new Queue("query-connections", { connection});

