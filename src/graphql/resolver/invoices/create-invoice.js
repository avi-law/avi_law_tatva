/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const { defaultLanguage } = require("../../../config/application");
const driver = require("../../../config/db");
const { APIError } = require("../../../utils");
const getPreparedNewInvoiceDetails = require("./get-prepared-new-invoice");
module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const systemAdmin = ctx.user.user_is_sys_admin;
  const userSurfLang = ctx.user.user_surf_lang || defaultLanguage;
  const customerId = params.customer_id;
  let session;
  try {
    if (!systemAdmin && !customerId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    session = driver.session();
    const result = await getPreparedNewInvoiceDetails(object, params, ctx);

    if (result) {
      console.log(result);
      return true
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    if (session) {
      session.close();
    }
    throw error;
  }
};
