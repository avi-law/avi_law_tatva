const { ApolloServer } = require("apollo-server-express");
const { makeAugmentedSchema } = require("neo4j-graphql-js");
const driver = require("./db");
const typeDefs = require("../graphql/graphql.schema");
const resolvers = require("../graphql/resolver");
const formatError = require("../graphql/formatError");
const IsAuthenticatedDirective = require("../graphql/directive/auth-directive");
const IsAdminDirective = require("../graphql/directive/admin-directive");

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
];
const excludeQuery = [
  "User",
  "UserCustomLogin",
  // "User_State",
  "Customer",
  "Log",
  // "Customer_State",
  "Invoice",
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
    isAuthenticated: IsAuthenticatedDirective,
    isAdmin: IsAdminDirective,
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
