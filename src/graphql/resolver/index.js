// NON AUTH Resolver
const login = require("./login");
const forgotPassword = require("./forgot-password");

// AUTH Resolver
const acceptGTC = require("./accept-gtc");
const acceptGDPR = require("./accept-gdpr");
const user = require("./user/get-user");

// For Website Owner Resolver
const encryptPassword = require("./encrypt-password");

const resolvers = {
  Mutation: {
    login,
    acceptGTC,
    acceptGDPR,
    encryptPassword,
    forgotPassword,
  },
  Query: {
    user,
  },
};

module.exports = resolvers;
