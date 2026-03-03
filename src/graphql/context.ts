// graphql/context.ts
import config from "../config/config.js";
import { prisma } from "../config/prisma.js";
import type { PrismaClient } from '@prisma/client'; // Import the type
import type { ExpressContextFunctionArgument } from '@as-integrations/express5';
import jwt from "jsonwebtoken";
import { z } from "zod";

export interface Context {
  prisma: PrismaClient; // Use the actual PrismaClient type, not typeof prisma
  auth : {
    user : {
      id : string;
    } | null,
    login : (id : string) => void;
    logout : () => void
  }
}

/*
* Function to parse JWT token and return user info
 */
const parseToken = (token : string) =>{
  const parsedToken = token ? jwt.verify(token, config.JWT_SECRET as string) : null;

  if(!parseToken){
    return null;
  }

  const payload = z.object({
    id : z.string()
  }).safeParse(parsedToken);

  return payload.success ? payload.data : null;
}

export const createContext = async (
  { req,res }: ExpressContextFunctionArgument
): Promise<Context> => {

  const token = req.cookies?.token;
  const user = token ? parseToken(token) : null;

 

  /*
  * Function to login user and set cookie
   */
  const login = (id : string) => {
    //@ts-ignore
    const token = jwt.sign({ id }, config.JWT_SECRET as string, { expiresIn: config.JWT_EXPIRY});


    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  }
 
  /*
  * Function to logout user and clear cookie
   */
  const logout  = () => {
    res.clearCookie("token");
  }


  return {
    prisma,
    auth : {
      user : user,
      login,
      logout 
    }
  };
};