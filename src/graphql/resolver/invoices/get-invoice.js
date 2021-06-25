/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const { defaultLanguage } = require("../../../config/application");
const driver = require("../../../config/db");
const { getInvoice } = require("../../../neo4j/invoice-query");
const { APIError } = require("../../../utils");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const systemAdmin = ctx.user.user_is_sys_admin;
  const userSurfLang = ctx.user.user_surf_lang || defaultLanguage;
  const customerId = params.customer_id;
  const invoiceId = params.invoice_id;
  let session;
  try {
    if (!systemAdmin && !customerId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    session = driver.session();
    const result = await session.run(getInvoice, { customerId, invoiceId });
    session.close();

    if (result && result.records.length > 0) {
      const invoice = result.records.map(
        (record) => record.get("invoice").properties
      );
      return invoice[0];
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
