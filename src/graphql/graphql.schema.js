const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    user_id: ID!
  }
`;

module.exports = typeDefs
