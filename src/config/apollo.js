const { ApolloServer } = require("apollo-server-express");
const { makeAugmentedSchema } = require("neo4j-graphql-js");
const driver = require("./db");
const typeDefs = require("../graphql/graphql.schema");
const resolvers = require("../graphql/resolver");
const formatError = require("../graphql/formatError");
const IsAuthenticatedDirective = require("../graphql/directive/auth-directive");

const excludeMutation = ["User"];
const excludeQuery = ["User"];

const schema = makeAugmentedSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    isAuthenticated: IsAuthenticatedDirective,
  },
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
