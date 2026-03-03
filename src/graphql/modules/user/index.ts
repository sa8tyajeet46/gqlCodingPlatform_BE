import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import resolver from "./resolvers.js"
import loadSchema from "../../../utils/loadSchema.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const typeDef = loadSchema("type_defs.graphql",__filename,__dirname);




export  { typeDef,resolver };
