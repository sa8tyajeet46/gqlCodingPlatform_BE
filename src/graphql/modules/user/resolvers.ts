import bcrypt, { compare } from "bcryptjs";
import { Context } from "../../context.js";
import config from "../../../config/config.js";

const userResolver = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      const userId = ctx.auth.user?.id;

      if (!userId) {
        throw new Error("Not authenticated");
      }
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      return user;
    },
    logout: async(_:unknown,__: unknown,ctx :Context) => {
       ctx.auth.logout()
       return "User logged out successfully";
    }
  },
  Mutation: {
    login: async (_:unknown,args:{email:string,password: string},ctx : Context) =>{
      const user = await ctx.prisma.user.findUnique( {where:{email : args.email}});

      if(!user){
        throw Error("Email is not registered");
      }

      const isPasswordMatched = await compare(args.password,user.password);

      if(!isPasswordMatched){
        throw Error("Invalid Credentials");
      }

      ctx.auth.login(String(user.id));

      return user;

    },
    signup: async (
      _: unknown,
      args: { name: string; email: string; password: string },
      ctx: Context,
    ) => {
      const SALT_ROUNDS = Number(config.SALT_ROUNDS);

      if (!SALT_ROUNDS) {
        throw new Error("Invalid SALT_ROUNDS");
      }

      const hashedPassword = await bcrypt.hash(args.password, SALT_ROUNDS);

      const user = await ctx.prisma.user.create({
        data: {
          name: args.name,
          email: args.email,
          password: hashedPassword,
        },
      });

      ctx.auth.login(String(user.id));
      return user;
    },
  },
};

export default userResolver;
