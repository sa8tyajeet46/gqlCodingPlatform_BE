import { createApp } from "./app.js";
import config from "./config/config.js";

const start = async (): Promise<void> => {
  const app = await createApp();

  app.listen(config.PORT, () => {
    console.log(`🚀 GraphQL running at http://localhost:${config.PORT}/graphql`);
  });
};

start();
