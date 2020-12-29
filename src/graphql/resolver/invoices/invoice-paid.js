/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { paidInvoice } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const invoiceId = params.invoice_id;
  try {
    const queryParams = {
      invoiceId,
      currentDate: common.formatDate(),
    };
    const result = await session.run(paidInvoice, queryParams);
    if (result && result.records.length > 0) {
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
