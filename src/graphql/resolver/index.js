// NON AUTH Resolver
const login = require("./login");
const forgotPassword = require("./forgot-password/send-forgot-password-link");
const verifyForgotPasswordLink = require("./forgot-password/verify-forgot-password-link");
const setNewPassword = require("./forgot-password/set-new-password");

const getNewsLetters = require("./new-letters/get-news-letters");
const getNewsLetter = require("./new-letters/get-news-letter");

// AUTH Resolver
const acceptGTC = require("./accept-gtc");
const acceptGDPR = require("./accept-gdpr");
const user = require("./user/get-user");

// System Admin Resolver
const getCustomers = require("./customers/get-customers");

// For Website Owner Resolver
const encryptPassword = require("./encrypt-password");

const resolvers = {
  Mutation: {
    login,
    acceptGTC,
    acceptGDPR,
    encryptPassword,
    forgotPassword,
    setNewPassword,
  },
  Query: {
    user,
    verifyForgotPasswordLink,
    getNewsLetters,
    getNewsLetter,
    getCustomers,
  },
};

module.exports = resolvers;
