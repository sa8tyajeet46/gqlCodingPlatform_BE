import { Queue } from "bullmq";
import Redis from "ioredis";

//@ts-ignore
export const connection = new Redis({
  host: "localhost",
  port: 6379,
   maxRetriesPerRequest: null
});

export const judgeQueue = new Queue("judge-queue", {
  connection,
});
