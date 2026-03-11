import express, { Express } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createApolloServer } from "./server.js";
import cookieParser from "cookie-parser";
import { judge0Webhook } from "./webhook/judge0.webhook.js";

export const createApp = async (): Promise<Express> => {
  const app = express();

  app.use(cors({
    origin: "https://gql-coding-platform-frontend.vercel.app", 
    credentials: true
  }));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.put("/webhook/judge0", judge0Webhook);

  app.use("/graphql", await createApolloServer());

  return app;
};
