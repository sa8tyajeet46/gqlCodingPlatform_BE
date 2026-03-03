import bcrypt, { compare } from "bcryptjs";
import { Context } from "../../context.js";
import config from "../../../config/config.js";
import { Topic } from "../../../types/problem.types.js";
import { judgeQueue } from "../../../queue/judge.queue.js";

const problemResolver = {
  Query: {
    getProblems: async (_: unknown, __: unknown, ctx: Context) => {
      const problems = await ctx.prisma.problems.findMany({
        include: { author: true },
      });

      return problems;
    },
    getTopicsToProblem: async (
      _: unknown,
      args: { problemId: number },
      ctx: Context,
    ) => {
      const userId = ctx.auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const problemId = Number(args.problemId);

      if (isNaN(problemId)) {
        throw new Error("Invalid problemId");
      }

      const problem = await ctx.prisma.problems.findUnique({
        where: { id: problemId },
      });
      if (!problem) {
        throw new Error("Problem not found");
      }

      const topics = await ctx.prisma.problemTopic.findMany({
        where: {
          problemId: problemId,
        },
      });

      return topics;
    },
    getTestCasesToProblem: async (
      _: unknown,
      args: { problemId: number },
      ctx: Context,
    ) => {
      const userId = ctx.auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const problemId = Number(args.problemId);

      if (isNaN(problemId)) {
        throw new Error("Invalid problemId");
      }

      const problem = await ctx.prisma.problems.findUnique({
        where: { id: problemId },
      });
      if (!problem) {
        throw new Error("Problem not found");
      }

      const testCases = await ctx.prisma.testCase.findMany({
        where: { problemId: problemId, isSample: true },
      });

      return testCases;
    },
    getSumissions : async (
      _: unknown,
      args: { problemId: number },
      ctx: Context,
    ) =>{
      const userId = ctx.auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const problemId = Number(args.problemId);

      if (isNaN(problemId)) {
        throw new Error("Invalid problemId");
      }

      const problem = await ctx.prisma.problems.findUnique({
        where: { id: problemId },
      });
      if (!problem) {
        throw new Error("Problem not found");
      }

      const submissions = await ctx.prisma.submission.findMany({
        where: {problemId : problemId, userId: userId}
      });

      return submissions;
    }
  },
  Mutation: {
    createProblem: async (
      _: unknown,
      args: { title: string; statement: string },
      ctx: Context,
    ) => {
      const userId = ctx.auth.user?.id;

      if (!userId) {
        throw new Error("Not authenticated");
      }

      const user = await ctx.prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.role != "ADMIN") {
        throw new Error("Only admins can create problems");
      }

      const problem = await ctx.prisma.problems.create({
        data: {
          title: args.title,
          statement: args.statement,
          authorId: userId,
        },
        include: { author: true },
      });

      return problem;
    },
    addTopicsToProblem: async (
      _: unknown,
      args: { problemId: number; topics: Topic[] },
      ctx: Context,
    ) => {
      const userId = ctx.auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user || user.role !== "ADMIN") {
        throw new Error("Only admins can add topics");
      }

      const problemId = Number(args.problemId);

      if (isNaN(problemId)) {
        throw new Error("Invalid problemId");
      }

      const problem = await ctx.prisma.problems.findUnique({
        where: { id: problemId },
      });
      if (!problem) {
        throw new Error("Problem not found");
      }

      const uniqueTopics = [...new Set(args.topics)];

      await ctx.prisma.problemTopic.createMany({
        data: uniqueTopics.map((topic) => ({
          problemId: problemId,
          topic,
        })),
        skipDuplicates: true,
      });

      return ctx.prisma.problems.findUnique({
        where: { id: problemId },
        include: { topics: true },
      });
    },
    addTestCasesToProblem: async (
      _: unknown,
      args: {
        problemId: string;
        testCases: {
          input: string;
          output: string;
          isSample?: boolean;
          order?: number;
        }[];
      },
      ctx: Context,
    ) => {
      const userId = ctx.auth.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user || user.role !== "ADMIN") {
        throw new Error("Only admins can add test cases");
      }

      const problemId = Number(args.problemId);
      if (isNaN(problemId)) {
        throw new Error("Invalid problemId");
      }

      const problem = await ctx.prisma.problems.findUnique({
        where: { id: problemId },
      });
      if (!problem) {
        throw new Error("Problem not found");
      }

      const created = await ctx.prisma.testCase.createMany({
        data: args.testCases.map((tc) => ({
          input: tc.input,
          output: tc.output,
          isSample: tc.isSample ?? false,
          order: tc.order,
          problemId,
        })),
      });

      return ctx.prisma.testCase.findMany({
        where: { problemId },
        orderBy: { order: "asc" },
      });
    },
    submitProblem: async (
    _: unknown,
    args: {
      problemId: number;
      code: string;
      language: "CPP" | "JAVA" | "PYTHON" | "JAVASCRIPT";
    },
    ctx: Context
  ) => {
    const userId = ctx.auth.user?.id;
    if (!userId) throw new Error("Not authenticated");

    const problemId = Number(args.problemId);
    if (isNaN(problemId)) throw new Error("Invalid problemId");

    const problem = await ctx.prisma.problems.findUnique({
      where: { id: problemId },
    });
    if (!problem) throw new Error("Problem not found");

    const submission = await ctx.prisma.submission.create({
      data: {
        code: args.code,
        language: args.language,
        userId,
        problemId,
        verdict: "PENDING",
      },
    });

    // 🔥 Push to queue (async execution)
    await judgeQueue.add("judge-submission", {
      submissionId: submission.id,
    });

    return submission;
  },
}
};

export default problemResolver;
