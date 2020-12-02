const login = require("./login");
const acceptGTC = require("./accept-gtc");
const acceptGDPR = require("./accept-gdpr");
const encryptPassword = require("./encrypt-password");

const resolvers = {
  Mutation: {
    login,
    acceptGTC,
    acceptGDPR,
    encryptPassword,
  },
};

module.exports = resolvers;
