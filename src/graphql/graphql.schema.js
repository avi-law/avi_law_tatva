const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    user_id: ID!
  }

  type User_State {
    user_id: ID!
    user_email: String!
    user_last_name: String
    user_first_name: String
    user_pwd: String
  }

  type Mutation {
    login(email: String!, password: String!): User_State
  }
`;

module.exports = typeDefs;
