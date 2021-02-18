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

const getNewsLettersOnLanding = require("./news-letters/get-news-letters_on_landing");
const getNewsLetter = require("./news-letters/get-news-letter");

// AUTH Resolver
const acceptGTC = require("./accept-gtc");
const acceptGDPR = require("./accept-gdpr");
const user = require("./user/get-user");
const getCustomer = require("./customers/get-customer");
const downloadInvoice = require("./download-file/download-invoice");
const setUserProperties = require("./user/set-user-properties");

// System Admin Resolver
const addUserInCustomer = require("./customers/add-user-in-customer");
const getCustomers = require("./customers/get-customers");
const getUsersByCustomer = require("./user/get-users-by-customer");
const getUsers = require("./user/get-users");
const User = require("./user");
const getUser = require("./user/get-user");
const invite = require("./invite/invite");
const getUserCustomerList = require("./customers/get-user-customer-list");
const getConnectUserList = require("./user/get-connected-users");
const getUsersNotConnectedByCustomer = require("./user/get-users-not-connected-by-customer");
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
const getNewsLetterList = require("./news-letters/get-news-letter-list");
const deleteNewsletter = require("./news-letters/delete-news-letter");
const createNewsletter = require("./news-letters/create-news-letter");
const updateNewsletter = require("./news-letters/update-news-letter");
const getNewsLetterDetails = require("./news-letters/get-news-letter-details");
const unsubscribeNewsletter = require("./news-letters/unsubscribe-news-letter");
const getNewsLetterYearList = require("./news-letters/get-news-letter-year-list");
const getNewsLetterEmailList = require("./news-letter-email/get-news-letter-email-list");

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
    updateNewsletter,
    unsubscribeNewsletter,
    addUserInCustomer,
  },
  Query: {
    User,
    user,
    verifyForgotPasswordLink,
    getNewsLettersOnLanding,
    getNewsLetter,
    getNewsLetterDetails,
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
    getUsersNotConnectedByCustomer,
    getNewsLetterYearList,
    getNewsLetterEmailList,
  },
};

module.exports = resolvers;
