/* eslint-disable no-param-reassign */
const fs = require("fs").promises;
const driver = require("../../../config/db");
const { defaultLanguage } = require("../../../config/application");
const { APIError } = require("../../../utils");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const systemAdmin = ctx.user.user_is_sys_admin;
  const userSurfLang = ctx.user.user_surf_lang || defaultLanguage;
  const invoiceIdString = params.invoice_id;
  try {
    if (!systemAdmin && !invoiceIdString) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (systemAdmin) {
      const contents = await fs.readFile(
        `${__dirname}/../../../uploads/invoices/${invoiceIdString}.pdf`,
        { encoding: "base64" }
      );
      return contents;
    }
  } catch (error) {
    session.close();
    throw error;
  }
};
