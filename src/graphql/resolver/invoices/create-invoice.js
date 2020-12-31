/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const ejs = require("ejs");
const {
  defaultLanguage,
  carbonCopyEmail,
} = require("../../../config/application");
const driver = require("../../../config/db");
const { APIError, constants } = require("../../../utils");
const { htmlToPdfBuffer } = require("../../../libs/html-to-pdf");
const sendMail = require("../../../libs/email");
const getPreparedNewInvoiceDetails = require("./get-prepared-new-invoice");
const { getCustomer } = require("../../../neo4j/query");

const documentNameAndLang = {
  INV_de_AT_CUST: {
    lang: "de",
    email: "INV_de_AT",
  },
  INV_de_AT_ALT_REC: {
    lang: "de",
    email: "INV_de_AT",
  },
  INV_de_DE_CUST: {
    lang: "de",
    email: "INV_de_DE",
  },
  INV_de_DE_ALT_REC: {
    lang: "de",
    email: "INV_de_DE",
  },
  INV_en_AT_CUST: {
    lang: "en",
    email: "INV_en_AT",
  },
  INV_en_AT_ALT_REC: {
    lang: "en",
    email: "INV_en_AT",
  },
  INV_en_DE_CUST: {
    lang: "en",
    email: "INV_en_DE",
  },
  INV_en_DE_ALT_REC: {
    lang: "en",
    email: "INV_en_DE",
  },
};

const getInvoicePdf = (filename, invoiceData) =>
  new Promise((resolve, reject) => {
    ejs.renderFile(
      `${__dirname}/../../../pdf/${filename}`,
      { invoiceData },
      (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      }
    );
  });

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
    let customerDetails = await session.run(getCustomer, { customerId });
    if (customerDetails && customerDetails.records) {
      const singleRecord = customerDetails.records[0];
      customerDetails = singleRecord.get(0);
    }
    if (result) {
      const options = {
        format: "A4",
      };
      const { documentName, customerInvoiceDetails } = result;
      // console.log("customerInvoiceDetails", customerInvoiceDetails);
      // console.log("customerDetails", customerDetails);
      // return true;
      const invoiceIdString = result.inv_id_strg;
      const filename = `invoice-${documentNameAndLang[documentName].lang}`;
      const pdfHtml = await getInvoicePdf(`${filename}.ejs`, result);
      const fileBuffer = await htmlToPdfBuffer(pdfHtml, options);
      const mailContent =
        constants.EMAIL[documentNameAndLang[documentName].lang.toUpperCase()]
          .INVOICE[documentNameAndLang[documentName].email];
      const mailOption = {
        to: "malipraful@mailinator.com",
        // cc: carbonCopyEmail,
        subject: mailContent.SUBJECT.replace(
          "{{year}}",
          result.inv_date_start.year
        ),
        attachments: [
          {
            filename: `${invoiceIdString}.pdf`,
            // content: fileBuffer.toString("base64"),
            contentType: "application/pdf",
            encoding: "base64",
          },
        ],
        data: mailContent,
      };
      await sendMail(mailOption, filename).catch((error) => {
        console.error("Send Mail :", error);
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      });
      return true;
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
