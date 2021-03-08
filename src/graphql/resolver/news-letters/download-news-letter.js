/* eslint-disable prefer-destructuring */
/* eslint-disable no-self-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const ejs = require("ejs");
const fs = require("fs");
const { frontendURL, defaultLanguage } = require("../../../config/application");
const driver = require("../../../config/db");
const { APIError, constants, common } = require("../../../utils");
const { htmlToPdfFile, htmlToPdfBuffer } = require("../../../libs/html-to-pdf");
const getNewsletterDetails = require("./get-news-letter-details");
const getLinkList = require("../link");

const getNewsletterPdf = (filename, nlData) =>
  new Promise((resolve, reject) => {
    ejs.renderFile(
      `${__dirname}/../../../pdf/${filename}`,
      { ...nlData },
      (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      }
    );
  });

const plus0 = (num) => `0${num.toString()}`.slice(-2);
module.exports = async (object, params, ctx) => {
  params = JSON.parse(JSON.stringify(params));
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const nlId = params.nl_id;
  const { lang } = params;
  let session;
  try {
    if (!systemAdmin || !nlId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    session = driver.session();
    const result = await getNewsletterDetails(object, params, ctx);
    const listLinks = await getLinkList();
    if (result) {
      // console.log(result);
      const filePath = `${__dirname}/../../../uploads/newsletter/test.pdf`;
      // const filePath = '';
      // if (!fs.existsSync(filePath)) {
      //   throw new APIError({
      //     lang: userSurfLang,
      //     message: "FILE_NOT_FOUND",
      //   });
      // }
      const nlDiretory = `${__dirname}/../../../uploads/newsletter`;
      fs.access(nlDiretory, (err) => {
        if (err && err.code === "ENOENT") {
          fs.mkdir(nlDiretory, (error) => {
            if (error) {
              console.error("NL directory not created :", error);
              throw new APIError({
                lang: userSurfLang,
                message: "INTERNAL_SERVER_ERROR",
              });
            }
          });
        }
      });
      const filename = `newsletter`;
      const pdfContent = constants.PDF[`FOOTER_${lang.toUpperCase()}`];
      const nlInfo = constants.PDF[`NL_INFO_${lang.toUpperCase()}`];
      let createdLog = {};
      let updatedLog = {};

      if (result.createdLog && result.createdLog.length > 0) {
        createdLog = result.createdLog[0];
        const d = new Date(createdLog.timestamp);
        const year = d.getFullYear();
        const monthTmp = d.getMonth() + 1;
        const month = plus0(monthTmp);
        const date = plus0(d.getDate());
        createdLog.timestamp = `${date}.${month}.${year}`;
      }

      if (result.updatedLog && result.updatedLog.length > 0) {
        updatedLog = result.updatedLog[0];
        const d = new Date(updatedLog.timestamp);
        const year = d.getFullYear();
        const monthTmp = d.getMonth() + 1;
        const month = plus0(monthTmp);
        const date = plus0(d.getDate());
        updatedLog.timestamp = `${date}.${month}.${year}`;
      }

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const monthTmp = currentDate.getMonth() + 1;
      const month = plus0(monthTmp);
      const date = plus0(currentDate.getDate());
      const hour = plus0(currentDate.getHours());
      const minute = plus0(currentDate.getMinutes());
      const currentTimestamp = `${date}.${month}.${year} ${hour}:${minute}`;

      const pdfHtml = await getNewsletterPdf(`${filename}.ejs`, {
        frontendURL,
        createdLog,
        updatedLog,
        ...nlInfo,
        currentTimestamp,
        nl_ord: common.transformNLOrderNumber(result.nl.nl_ord),
        iso_3166_1_alpha_2: result.country.iso_3166_1_alpha_2,
        nl_date: common.formatDate(result.nl.nl_date).replace(/-/g, "."),
        nl_title_long: result.nls[lang].nl_title_long,
        nl_text: common.nlContentTransformLink(
          result.nls[lang].nl_text,
          listLinks,
          true
        ),
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
      await htmlToPdfFile(pdfHtml, options, filePath);
      const contents = await htmlToPdfBuffer(pdfHtml, options);
      return contents.toString("base64");
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
