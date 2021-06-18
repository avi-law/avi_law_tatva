const { ApolloServer } = require("apollo-server-express");
const { makeAugmentedSchema } = require("neo4j-graphql-js");
const driver = require("./db");
const typeDefs = require("../graphql/schema.graphql");
const resolvers = require("../graphql/resolver");
const formatError = require("../graphql/formatError");
const isAuthenticatedDirective = require("../graphql/directive/auth-directive");
const isAdminDirective = require("../graphql/directive/admin-directive");
const isUnAuthenticated = require("../graphql/directive/unAuth-directive");
const { playground, introspection } = require("./application");

const excludeMutation = [
  "User",
  "UserCustomLogin",
  "User_State",
  "Customer",
  "Currency",
  "Log",
  "Invoice",
  "loginCustomerStatesCustom",
  "userAddresses",
  "UserCustom",
  "Country",
  "Log_Type",
  "NewsletterCustom",
  "NL_Article",
  "Rule_Book_Tag",
  "Sol_State",
  "Sol_Type",
  "Sol",
  "Link",
  "Ref_Link",
  "NL_Email",
  "NL_Email_State",
  "NL",
  "NL_State",
  "Blog",
  "Blog_State",
  "Language",
  "Country_Sub",
  "Rule_Book",
  "Rule_Book_Struct",
  "Rule_Book_Struct_State",
];
const excludeQuery = [
  // "User",
  "UserCustomLogin",
  // "User_State",
  "Customer",
  "Log",
  // "Customer_State",
  // "Invoice",
  "loginCustomerStatesCustom",
  "userAddresses",
  "UserCustom",
  "NewsletterCustom",
  "NL_Article",
];

const schema = makeAugmentedSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    isAuthenticated: isAuthenticatedDirective,
    isUnAuthenticated,
    isAdmin: isAdminDirective,
  },
  logger: { log: (e) => console.error(e) },
  allowUndefinedInResolve: true,
  config: {
    query: {
      exclude: excludeQuery,
    },
    mutation: {
      exclude: excludeMutation,
    },
  },
});

const responseTime = () => {
  const start = Date.now();
  return {
    willSendResponse(ctx) {
      const stop = Date.now();
      const size = JSON.stringify(ctx.response).length * 2;
      ctx.context.req.res.setHeader("X-Response-Time", stop - start);
      ctx.context.req.res.setHeader("X-Response-Context-size", size);
      // console.log(
      //   `Operation ${op} completed in ${elapsed} ms and returned ${size} bytes`
      // );
    },
  };
};

module.exports = new ApolloServer({
  context: ({ req }) => ({
    driver,
    req,
  }),
  schema,
  formatError,
  introspection,
  playground,
  plugins: [
    {
      requestDidStart() {
        return responseTime();
      },
    },
  ],
});
