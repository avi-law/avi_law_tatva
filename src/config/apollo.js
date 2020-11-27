const { ApolloServer } = require('apollo-server-express');
const { makeAugmentedSchema } = require('neo4j-graphql-js');
const driver = require('./db');
const typeDefs = require('../graphql/graphql.schema');
const resolvers = require('../graphql/resolver');
const formatError = require('../graphql/formatError');
const IsAuthenticatedDirective = require('../graphql/directive/auth-directive');


const schema = makeAugmentedSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    isAuthenticated: IsAuthenticatedDirective,
  },
  config: {
    auth: {
      hasScope: true
    }
  }
});

module.exports = new ApolloServer({
  context: ({ req }) => {
    return {
      driver,
      req
    };
  },
  schema,
  formatError,
  introspection: true,
  playground: true
});
