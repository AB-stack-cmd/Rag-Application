import { Redis } from "ioredis";
import { Queue } from "bullmq";

export const connection = new Redis({
    host: "localhost",
    port: 6379
})

// Queue for worker
export const Query = new Queue("query-connections", { connection});

