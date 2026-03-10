import { makeExecutableSchema } from "graphql-tools";
import {resolver as userResolver , typeDef as userSchema} from "./user/index.js"
import {resolver as problemResolver, typeDef as problemSchema} from "./problem/index.js"






 const schema = makeExecutableSchema({
    typeDefs: [userSchema,problemSchema],
    resolvers : [userResolver,problemResolver]
});

export default schema;