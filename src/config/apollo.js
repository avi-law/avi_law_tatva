const { ApolloServer } = require("apollo-server-express");
const { makeAugmentedSchema } = require("neo4j-graphql-js");
const driver = require("./db");
const typeDefs = require("../graphql/graphql.schema");
const resolvers = require("../graphql/resolver");
const formatError = require("../graphql/formatError");
const isAuthenticatedDirective = require("../graphql/directive/auth-directive");
const isAdminDirective = require("../graphql/directive/admin-directive");
const isUnAuthenticated = require("../graphql/directive/unAuth-directive");

const excludeMutation = [
  "User",
  "UserCustomLogin",
  "User_State",
  "Customer",
  "Currency",
  "Log",
  // "Customer_State",
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
  "NL",
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
  logger: { log: (e) => console.error(e.message) },
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

module.exports = new ApolloServer({
  context: ({ req }) => ({
    driver,
    req,
  }),
  schema,
  formatError,
  introspection: true,
  playground: true,
});
