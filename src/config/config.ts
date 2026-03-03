import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

// get directory url
const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.resolve(__fileName);

dotenv.config({ path: path.resolve(__dirName, "../../../.env") });

const envVars = process.env;

interface Config {
  PORT: number | string;
  JWT_SECRET : string | undefined;
  JWT_EXPIRY : string | undefined;
  SALT_ROUNDS : string | number | undefined;
  JUDGE0_API_KEY : string | undefined;
  API_BASE_URL : string | undefined;
}

const config: Config = {
  PORT: envVars.PORT || 4000,
  JWT_SECRET : envVars.JWT_SECRET,
  JWT_EXPIRY : envVars.JWT_EXPIRY,
  SALT_ROUNDS : envVars.SALT_ROUNDS,
  JUDGE0_API_KEY : envVars.JUDGE0_API_KEY,
  API_BASE_URL : envVars.API_BASE_URL
};

export default config;