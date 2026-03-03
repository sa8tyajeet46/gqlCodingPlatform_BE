import { Worker } from "bullmq";
import { connection } from "../queue/judge.queue.js";
import fetch from "node-fetch";
import { prisma } from "../config/prisma.js";
import config from "../config/config.js";

const LANGUAGE_MAP: Record<string, number> = {
  CPP: 54,
  JAVA: 62,
  PYTHON: 71,
  JAVASCRIPT: 63,
};

new Worker(
  "judge-queue",
  async (job) => {
    const { submissionId } = job.data;

    (submissionId)

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        problem: {
          include: {
            testCases: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!submission) return;

    const batchSubmissions = submission.problem.testCases.map((tc) => ({
      source_code: submission.code,
      language_id: LANGUAGE_MAP[submission.language],
      stdin: tc.input,
      callback_url: `${config.API_BASE_URL}/webhook/judge0?submissionId=${submissionId}`,
      expected_output: tc.output,
     
    }));

    (submission.problem.testCases);
    try{
    await fetch(
      "https://judge0-ce.p.rapidapi.com/submissions/batch?wait=false&base64_encoded=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": config.JUDGE0_API_KEY!,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          submissions: batchSubmissions,
        }),
      }
    );
  }catch(err){
  }
  },
  { connection }
);
