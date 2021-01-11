/* eslint-disable no-self-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const ejs = require("ejs");
const fs = require("fs");
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
const { createInvoice } = require("../../../neo4j/query");

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
      // const invoiceEmailRecipient = "dummy-user-de@avi-law.com";
      if (availableInvoice.indexOf(documentName) === -1) {
        console.error(`${documentName} type of invoice document not found`);
        throw new APIError({
          lang: userSurfLang,
          message: "INTERNAL_SERVER_ERROR",
        });
      }
      const yearOfInvoice = result.inv_date_start.year;
      const invoiceDiretory = `${__dirname}/../../../uploads/invoices/${yearOfInvoice}`;
      fs.access(invoiceDiretory, (err) => {
        if (err && err.code === "ENOENT") {
          fs.mkdir(invoiceDiretory, (error) => {
            if (error) {
              console.error("Invoice directory not created :", error);
              throw new APIError({
                lang: userSurfLang,
                message: "INTERNAL_SERVER_ERROR",
              });
            }
          });
        }
      });
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
      let footer = "";
      if (pdfContent.CONT240 && pdfContent.CONT240 !== "") {
        footer = pdfContent.CONT240;
      }
      if (pdfContent.CONT250 && pdfContent.CONT250 !== "") {
        footer = `${footer} <br> ${pdfContent.CONT250} `;
      }
      if (pdfContent.CONT300 && pdfContent.CONT300 !== "") {
        footer = `${footer} <br> ${pdfContent.CONT300} `;
      }
      if (pdfContent.CONT260 && pdfContent.CONT260 !== "") {
        footer = `${footer} <br> <a href="${pdfContent.CONT260}" style="font-size: 6.5px;line-height: 1.2;color: #029fdb;text-decoration: none;">${pdfContent.CONT260}`;
      }
      const options = {
        footer: {
          height: "25mm",
          contents: {
            default: `
            <footer style="max-width: 1140px;margin: 0 auto;padding: 0 63px;font-family: 'Open Sans', sans-serif;font-weight: 400;">
              <address style="font-size: 6.5px;margin: 0;padding: 0;line-height: 1.321;color: #707070;font-style: normal;">
                ${footer}
              </address>
            </footer>`,
          },
        },
      };
      const fileBuffer = await htmlToPdfBuffer(pdfHtml, options);
      const mailContent =
        constants.EMAIL[invoiceLanguage.toUpperCase()].INVOICE[invoiceContent];
      const mailOption = {
        to: invoiceEmailRecipient,
        subject: mailContent.SUBJECT.replace("{{year}}", yearOfInvoice),
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
          invoiceSentFrom,
          logo:
            invoiceSentFrom === "DE"
              ? `assets/logos/${bothLogo}`
              : `assets/logos/${logo}`,
        },
      };
      if (invoiceSentFrom === "DE") {
        mailOption.bcc = [carbonCopyEmail, blindcarbonCopyEmail];
      } else {
        mailOption.cc = carbonCopyEmail;
      }
      await sendMail(mailOption, filename)
        .then(() => {
          htmlToPdfFile(
            pdfHtml,
            options,
            `${__dirname}/../../../uploads/invoices/${yearOfInvoice}/${invoiceIdString}.pdf`
          );
        })
        .catch((error) => {
          console.error("Send Mail :", error);
          throw new APIError({
            lang: userSurfLang,
            message: "INTERNAL_SERVER_ERROR",
          });
        });
      const tx = session.beginTransaction();
      return tx
        .run(createInvoice, {
          customerId,
          country_id: result.inv_country_id,
          invoice: {
            ...result,
            inv_date: common.convertToTemporalDate(result.inv_date),
            inv_date_start: common.convertToTemporalDate(result.inv_date_start),
            inv_date_end: common.convertToTemporalDate(result.inv_date_end),
            inv_country_id: null,
            invoiceGoesToAltRec: null,
            invoiceSentFrom: null,
            invoiceLanguage: null,
            invoiceContent: null,
            documentName: null,
          },
        })
        .then((res) => {
          if (res && res.records.length > 0) {
            tx.commit();
            return true;
          }
          throw new APIError({
            lang: userSurfLang,
            message: "INTERNAL_SERVER_ERROR",
          });
        })
        .catch((e) => {
          console.log(e);
          session.close();
          throw new APIError({
            lang: userSurfLang,
            message: "INTERNAL_SERVER_ERROR",
          });
        });
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
