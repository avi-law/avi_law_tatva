/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const ejs = require("ejs");
const {
  frontendURL,
  defaultLanguage,
  carbonCopyEmail,
  blindcarbonCopyEmail,
  logo,
  bothLogo,
} = require("../../../config/application");
const driver = require("../../../config/db");
const { APIError, constants, common } = require("../../../utils");
const { htmlToPdfBuffer, htmlToPdfFile } = require("../../../libs/html-to-pdf");
const sendMail = require("../../../libs/email");
const getPreparedNewInvoiceDetails = require("./get-prepared-new-invoice");

const availableInvoice = [
  "INV_de_AT_CUST",
  "INV_de_AT_ALT_REC",
  "INV_de_DE_CUST",
  "INV_de_DE_ALT_REC",
  "INV_en_AT_CUST",
  "INV_en_AT_ALT_REC",
  "INV_en_DE_CUST",
  "INV_en_DE_ALT_REC",
];

const getInvoicePdf = (filename, invoiceData) =>
  new Promise((resolve, reject) => {
    ejs.renderFile(
      `${__dirname}/../../../pdf/${filename}`,
      { ...invoiceData },
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
    if (result) {
      const {
        documentName,
        invoiceGoesToAltRec,
        invoiceSentFrom,
        invoiceLanguage,
        invoiceContent,
      } = result;
      const invoiceEmailRecipient = result.inv_email;
      if (availableInvoice.indexOf(documentName) === -1) {
        console.error(`${documentName} type of invoice document not found`);
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      }

      const invoiceIdString = result.inv_id_strg;
      const pdfContent = constants.PDF[invoiceContent];
      const filename = `invoice`;
      const pdfHtml = await getInvoicePdf(`${filename}.ejs`, {
        frontendURL,
        invoiceGoesToAltRec,
        amountNumberFormat: common.amountNumberFormat,
        ...result,
        ...pdfContent,
      });
      const fileBuffer = await htmlToPdfBuffer(pdfHtml);
      // const storeFile = await htmlToPdfFile(pdfHtml, {}, "./test.pdf");
      const mailContent =
        constants.EMAIL[invoiceLanguage.toUpperCase()].INVOICE[invoiceContent];
      const mailOption = {
        to: invoiceEmailRecipient,
        cc: carbonCopyEmail,
        subject: mailContent.SUBJECT.replace(
          "{{year}}",
          result.inv_date_start.year
        ),
        attachments: [
          {
            filename: `${invoiceIdString}.pdf`,
            content: fileBuffer.toString("base64"),
            contentType: "application/pdf",
            encoding: "base64",
          },
        ],
        data: {
          ...mailContent,
          logo:
            invoiceSentFrom === "DE"
              ? `assets/logos/${bothLogo}`
              : `assets/logos/${logo}`,
        },
      };
      if (invoiceSentFrom === "DE") {
        mailOption.bcc = `${carbonCopyEmail},${blindcarbonCopyEmail}`;
      }
      // await sendMail(mailOption, filename).catch((error) => {
      //   console.error("Send Mail :", error);
      //   throw new APIError({
      //     lang: userSurfLang,
      //     message: "INTERNAL_SERVER_ERROR",
      //   });
      // });
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
