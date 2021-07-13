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
const getNewsLetters = require("./news-letters/get-news-letters");
const deleteNewsletter = require("./news-letters/delete-news-letter");
const createNewsletter = require("./news-letters/create-news-letter");
const updateNewsletter = require("./news-letters/update-news-letter");
const getNewsLetterDetails = require("./news-letters/get-news-letter-details");
const unsubscribeNewsletter = require("./news-letters/unsubscribe-news-letter");
const getNewsLetterYearList = require("./news-letters/get-news-letter-year-list");
const getNewsLetterEmailList = require("./news-letter-email/get-news-letter-email-list");
const getNewsLetterTagForEmail = require("./news-letter-email/get-news-letter-tag-for-email");
const getNewsLetterEmailOrder = require("./news-letter-email/generate-news-letter-email-order");
const createNewsletterEmail = require("./news-letter-email/create-news-letter-email");
const updateNewsletterEmail = require("./news-letter-email/update-news-letter-email");
const deleteNewsletterEmail = require("./news-letter-email/delete-news-letter-email");
const getNewsLetterEmail = require("./news-letter-email/get-news-letter-email");
const tweetNewsletter = require("./news-letters/tweet-news-letter");
const downloadNewsletter = require("./news-letters/download-news-letter");
const getSolList = require("./provisions/get-sol-list");
const getSols = require("./provisions/get-sols");
const getSolId = require("./provisions/get-sol-id");
const createSol = require("./provisions/create-sol");
const getSol = require("./provisions/get-sol");
const updateSol = require("./provisions/update-sol");
const deleteSol = require("./provisions/delete-sol");
const getSolType = require("./provisions/get-sol-type");
const getRuleBookStructure = require("./rule-book-structure/get-rule-book-structure");
const getRuleBookTreeStructure = require("./rule-book-structure/get-rule-book-tree-structure");
const getRuleElementTreeStructure = require("./rules-element-structure/get-rule-element-tree-structure");
const searchNL = require("./search/search-nl");
const searchSol = require("./search/search-sol");
const solIdExists = require("./provisions/sol-id-exists");
const newsletterTransformSolId = require("./nl-transform-sol-id");
const createBlog = require("./blog/create-blog");
const updateBlog = require("./blog/update-blog");
const deleteBlog = require("./blog/delete-blog");
const getBlogList = require("./blog/get-blog-list");
const getBlog = require("./blog/get-blog");
const getBlogDetails = require("./blog/get-blog-details");
const getBlogYearList = require("./blog/get-blog-year-list");
const tweetBlog = require("./blog/tweet-blog");
const addRuleBookStruct = require("./rule-book-structure/add-rule-book-struct");
const addRuleBook = require("./rule-book-structure/add-rule-book");
const addRuleBookIssue = require("./rule-book-structure/add-rule-book-issue");
const updateRuleBookStruct = require("./rule-book-structure/update-rule-book-struct");
const updateRuleBook = require("./rule-book-structure/update-rule-book");
const deleteRuleBook = require("./rule-book-structure/delete-rule-book");
const deleteRuleBookStruct = require("./rule-book-structure/delete-rule-book-struct");
const deleteRuleBookIssue = require("./rule-book-structure/delete-rule-book-issue");
const updateRuleBookIssue = require("./rule-book-structure/update-rule-book-issue");
const getRuleBookIssue = require("./rule-book-structure/get-rule-book-issue");
const downloadBlogPosts = require("./blog/download-blog");
const getSolTagForRuleBookIssue = require("./rule-book-structure/get-sol-tag-for-rule-book-issue");
const changeOrder = require("./rule-book-structure/change-order");
const getRuleBook = require("./rule-book/get-rule-book");
const getRuleBookBreadcrumbs = require("./rule-book/get-rule-book-breadcrumbs");
const searchRuleBook = require("./rule-book/search-rule-book");
const addRuleElement = require("./rules-element-structure/add-rule-element");
const updateRuleElement = require("./rules-element-structure/update-rule-element");
const deleteRuleElement = require("./rules-element-structure/delete-rule-element");
const getRuleElement = require("./rules-element-structure/get-rule-element");
const changeRuleElementOrder = require("./rules-element-structure/change-rule-element-order");
const getRuleElementState = require("./rules-element-structure/get-rule-element-state");
const addRuleElementState = require("./rules-element-structure/add-rule-element-state");
const updateRuleElementState = require("./rules-element-structure/update-rule-element-state");
const getRuleElementStateDetails = require("./rules-element-structure/get-rule-element-state-details");
const deleteRuleElementState = require("./rules-element-structure/delete-rule-element-state");
const getAllRuleElementState = require("./rules-element-structure/get-all-rule-element-state");
const getSolTagForRuleElement = require("./rules-element-structure/get-sol-tag-for-rule-element");
const searchRuleElement = require("./search/search-rule-element");
const validateUploadToken = require("./validate-upload-token");
const getHiTechRuleElementList = require("./rules-element-structure/get-hitech-rule-element-list");
const getHiTechRuleElementState = require("./rules-element-structure/get-hitech-rule-element-state");
const updateHiTechRuleElementState = require("./rules-element-structure/update-hitech-rule-element-state");
const getRuleElementBackLinks = require("./rules-element-structure/get-rule-element-back-links");
const getRuleElementTags = require("./rules-element-structure/get-rule-element-tags");
const getAMCGMRuleElement = require("./rules-element-structure/get-amc-gm-rule-element");
const getUserHistoryLogs = require("./user/get-user-history-log");
const getUserHistoryLogList = require("./user/get-user-history-log-list");
const getRuleBookWarningType = require("./rule-book/get-rule-book-warning-type");
const userFavorite = require("./user/user-favorite");
const getUserFavorites = require("./user/get-user-favorites");
const changeUserFavoriteOrder = require("./user/change-user-favorite-order");
// For Website Owner Resolver
const encryptPassword = require("./encrypt-password");
const createBackLinForExistsRuleElement = require("./backlink");

const resolvers = {
  Mutation: {
    login,
    acceptGTC,
    acceptGDPR,
    encryptPassword,
    validateUploadToken,
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
    createNewsletterEmail,
    updateNewsletterEmail,
    deleteNewsletterEmail,
    tweetNewsletter,
    createSol,
    updateSol,
    deleteSol,
    newsletterTransformSolId,
    createBlog,
    updateBlog,
    deleteBlog,
    tweetBlog,
    addRuleBookStruct,
    addRuleBook,
    addRuleBookIssue,
    updateRuleBookStruct,
    updateRuleBook,
    updateRuleBookIssue,
    deleteRuleBook,
    deleteRuleBookStruct,
    deleteRuleBookIssue,
    changeOrder,
    addRuleElement,
    updateRuleElement,
    deleteRuleElement,
    changeRuleElementOrder,
    addRuleElementState,
    updateRuleElementState,
    deleteRuleElementState,
    updateHiTechRuleElementState,
    createBackLinForExistsRuleElement,
    userFavorite,
    changeUserFavoriteOrder,
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
    downloadNewsletter,
    getUserCustomerList,
    getConnectUserList,
    getUsersByCustomer,
    getUsers,
    getUser,
    userEmailExists,
    verifyInvitation,
    verifyEmail,
    getNewsLetterList,
    getNewsLetters,
    getUsersNotConnectedByCustomer,
    getNewsLetterYearList,
    getNewsLetterEmailList,
    getNewsLetterTagForEmail,
    getNewsLetterEmailOrder,
    getNewsLetterEmail,
    getSolList,
    getSolId,
    getSol,
    getSolType,
    getRuleBookStructure,
    getRuleBookTreeStructure,
    getRuleElementTreeStructure,
    getSols,
    searchNL,
    searchSol,
    solIdExists,
    getBlogList,
    getBlog,
    getBlogYearList,
    getRuleBookIssue,
    getBlogDetails,
    downloadBlogPosts,
    getSolTagForRuleBookIssue,
    getRuleBook,
    getRuleBookBreadcrumbs,
    searchRuleBook,
    getRuleElement,
    getRuleElementState,
    getRuleElementStateDetails,
    getAllRuleElementState,
    getSolTagForRuleElement,
    searchRuleElement,
    getHiTechRuleElementList,
    getHiTechRuleElementState,
    getRuleElementBackLinks,
    getRuleElementTags,
    getAMCGMRuleElement,
    getUserHistoryLogs,
    getUserHistoryLogList,
    getRuleBookWarningType,
    getUserFavorites,
  },
};

module.exports = resolvers;
