// NON AUTH Resolver
const login = require("./login");
const register = require("./signup");
const forgotPassword = require("./forgot-password/send-forgot-password-link");
const verifyForgotPasswordLink = require("./forgot-password/verify-forgot-password-link");
const setNewPassword = require("./forgot-password/set-new-password");
const verifyInvitation = require("./invite/verify-invitation");
const verifyEmail = require("./signup/email-verify");
const resendEmailVerify = require("./signup/resend-email-verify");
const invitedUserCreate = require("./invite/invited-user-create");

const getNewsLetters = require("./new-letters/get-news-letters");
const getNewsLetter = require("./new-letters/get-news-letter");

// AUTH Resolver
const acceptGTC = require("./accept-gtc");
const acceptGDPR = require("./accept-gdpr");
const user = require("./user/get-user");
const getCustomer = require("./customers/get-customer");
const downloadInvoice = require("./download-file/download-invoice");
const setUserProperties = require("./user/set-user-properties");

// System Admin Resolver
const getCustomers = require("./customers/get-customers");
const getUsersByCustomer = require("./user/get-users-by-customer");
const getUsers = require("./user/get-users");
const User = require("./user");
const getUser = require("./user/get-user");
const invite = require("./invite/invite");
const getUserCustomerList = require("./customers/get-user-customer-list");
const getConnectUserList = require("./user/get-connected-users");
const createCustomer = require("./customers/create-customer");
const createUser = require("./user/create-user");
const newUser = require("./user/new-user");
const userEmailExists = require("./user/user-email-exists");
const newCustomer = require("./customers/new-customer");
const getInvoices = require("./invoices/get-invoices");
const getInvoice = require("./invoices/get-invoice");
const invoicePaid = require("./invoices/invoice-paid");
const createInvoice = require("./invoices/create-invoice");
const getPreparedNewInvoiceDetails = require("./invoices/get-prepared-new-invoice");
const getInvoiceCustomers = require("./invoices/get-invoice-customers");
const invoiceCancel = require("./invoices/invoice-cancel");
const getNewsLetterList = require("./new-letters/get-news-letter-list");
const deleteNewsletter = require("./new-letters/delete-news-letter");
const createNewsletter = require("./new-letters/create-news-letter");

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
    createInvoice,
    newCustomer,
    setUserProperties,
    createUser,
    newUser,
    invite,
    register,
    invitedUserCreate,
    invoiceCancel,
    resendEmailVerify,
    deleteNewsletter,
    createNewsletter,
  },
  Query: {
    User,
    user,
    verifyForgotPasswordLink,
    getNewsLetters,
    getNewsLetter,
    getCustomers,
    getCustomer,
    getInvoices,
    getInvoice,
    getPreparedNewInvoiceDetails,
    getInvoiceCustomers,
    downloadInvoice,
    getUserCustomerList,
    getConnectUserList,
    getUsersByCustomer,
    getUsers,
    getUser,
    userEmailExists,
    verifyInvitation,
    verifyEmail,
    getNewsLetterList,
  },
};

module.exports = resolvers;
