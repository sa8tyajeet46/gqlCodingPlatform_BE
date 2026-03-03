import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

const mapVerdict = (id: number) => {
  if (id === 3) return "ACCEPTED";
  if (id === 4) return "WRONG_ANSWER";
  if (id === 5) return "TIME_LIMIT_EXCEEDED";
  if (id === 6) return "COMPILATION_ERROR";
  return "RUNTIME_ERROR";
};

const extractMeta = (input: string) => {
  if (!input || typeof input !== "string") return {};

  const submissionMatch = input.match(/submissionId(\d+)/);

  return {
    submissionId: submissionMatch ? Number(decodeBase64(submissionMatch[1])) : null,
  };
};

const decodeBase64 = (value?: string) => {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf-8").trim();
};



export const judge0Webhook = async (req: Request, res: Response) => {

  const { status, stdout, time, memory, additional_files,expected_output } = req.body;



  const   submissionId   = Number(req.query.submissionId);

  (submissionId);

  if (!submissionId) return res.sendStatus(400);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  (submission);

  if (!submission || submission.verdict !== "PENDING") {
    return res.sendStatus(200);
  }

  const verdict = mapVerdict(status.id);

  if (verdict !== "ACCEPTED") {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { verdict },
    });
    return res.sendStatus(200);
  }

  const actualOutput = decodeBase64(stdout);
const expected = decodeBase64(expected_output ? expected_output:undefined);


if (actualOutput !== expected) {
  await prisma.submission.update({
    where: { id: submissionId },
    data: { verdict: "WRONG_ANSWER" },
  });
  return res.sendStatus(200);
}

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      executionTime: Math.floor((time || 0) * 1000),
      memoryUsed: memory || 0,
      verdict: "ACCEPTED",
    },
  });

  return res.sendStatus(200);
};
