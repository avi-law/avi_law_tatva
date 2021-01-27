/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { cancelInvoice, logInvoice } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const invoiceId = params.invoice_id;
  try {
    if (!systemAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const queryParams = {
      inv_id_strg: invoiceId,
    };
    const result = await session.run(cancelInvoice, queryParams);
    if (result && result.records.length > 0) {
      common.loggingData(logInvoice, {
        type: constants.LOG_TYPE_ID.DELETE_INVOICE,
        current_user_email: userEmail,
        inv_id_strg: invoiceId,
      });
      return true;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
