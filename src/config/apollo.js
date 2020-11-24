const { ApolloServer } = require('apollo-server-express');
const { makeAugmentedSchema } = require('neo4j-graphql-js');
const driver = require('./db');
const typeDefs = require('../graphql/graphql.schema');
const resolvers = require('../graphql/resolver');
const formatError = require('../graphql/formatError');


const schema = makeAugmentedSchema({
  typeDefs,
  resolvers,
});

module.exports = new ApolloServer({
  context: { driver },
  schema,
  formatError
});
