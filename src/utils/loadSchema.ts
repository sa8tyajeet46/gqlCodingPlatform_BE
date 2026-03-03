import path from "path";
import fs from "fs"

const loadSchema = (file: string,_filename:string,__dirname:string): string =>
  fs.readFileSync(path.join(__dirname, file), "utf8");

export default loadSchema;