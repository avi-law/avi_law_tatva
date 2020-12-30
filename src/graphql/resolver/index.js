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
const getCustomer = require("./customers/get-customer");

// System Admin Resolver
const getCustomers = require("./customers/get-customers");
const createCustomer = require("./customers/create-customer");
const getInvoices = require("./invoices/get-invoices");
const getInvoice = require("./invoices/get-invoice");
const invoicePaid = require("./invoices/invoice-paid");
const getPreparedNewInvoiceDetails = require("./invoices/get-prepared-new-invoice");

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
    createCustomer,
    invoicePaid,
  },
  Query: {
    user,
    verifyForgotPasswordLink,
    getNewsLetters,
    getNewsLetter,
    getCustomers,
    getCustomer,
    getInvoices,
    getInvoice,
    getPreparedNewInvoiceDetails,
  },
};

module.exports = resolvers;
