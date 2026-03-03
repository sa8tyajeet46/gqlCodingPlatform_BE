import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@as-integrations/express5';
import type { ExpressContextFunctionArgument } from '@as-integrations/express5';

import { createContext } from "./graphql/context.js";
import schema from "./graphql/modules/schema.js";

export const createApolloServer = async () => {
  const server = new ApolloServer({ schema });

  await server.start();

  return expressMiddleware(server, {
    context: createContext
  });
};
