/* eslint-disable no-param-reassign */
const fs = require("fs");
const driver = require("../../../config/db");
const { defaultLanguage } = require("../../../config/application");
const { APIError } = require("../../../utils");

module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const session = driver.session();
  const userSurfLang = ctx.user.user_surf_lang || defaultLanguage;
  const invoiceIdString = params.invoice_id;
  const yearOfInvoice = invoiceIdString.split("_")[1];
  const filePath = `${__dirname}/../../../uploads/invoices/${yearOfInvoice}/${invoiceIdString}.pdf`;
  try {
    if (!invoiceIdString) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (!fs.existsSync(filePath)) {
      throw new APIError({
        lang: userSurfLang,
        message: "FILE_NOT_FOUND",
      });
    }
    const contents = await fs.readFileSync(filePath, { encoding: "base64" });
    return contents;
  } catch (error) {
    session.close();
    throw error;
  }
};
