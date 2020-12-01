const login = require('./login');
const acceptGTC = require('./accept-gtc');
const acceptGDPR = require('./accept-gdpr');

const resolvers = {
  Mutation: {
    login,
    acceptGTC,
    acceptGDPR
  },
};

module.exports = resolvers