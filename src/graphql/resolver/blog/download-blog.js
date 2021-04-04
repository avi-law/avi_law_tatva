/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
const ejs = require("ejs");
const _ = require("lodash");
const QRCode = require("qrcode");
const { frontendURL, defaultLanguage } = require("../../../config/application");
const driver = require("../../../config/db");
const { APIError, constants, common } = require("../../../utils");
const { htmlToPdfFile, htmlToPdfBuffer } = require("../../../libs/html-to-pdf");
const getBlogDetails = require("./get-blog-details");
const getLinkList = require("../link");

const getBlogPdf = (filename, blData) =>
  new Promise((resolve, reject) => {
    ejs.renderFile(
      `${__dirname}/../../../pdf/${filename}`,
      { ...blData },
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
  const userSurfLang = _.get(user, "user_surf_lang", defaultLanguage);
  const blogId = params.blog_id;
  const { lang } = params;
  let session;
  try {
    if (!blogId) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    session = driver.session();
    const result = await getBlogDetails(object, params, ctx);
    const listLinks = await getLinkList();
    if (result) {
      const blYear = result.bl.blog_date.year;
      const qrURL = `${frontendURL}${constants.BLOG_POSTS_SERVICE_PATH}/${blYear}/${blogId}`;
      const filename = `blog`;
      const pdfContent = constants.PDF[`FOOTER_${lang.toUpperCase()}`];
      const blInfo = constants.PDF[`BLOG_INFO_${lang.toUpperCase()}`];
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
      const generateQR = await QRCode.toDataURL(qrURL);
      const pdfHtml = await getBlogPdf(`${filename}.ejs`, {
        frontendURL,
        createdLog,
        updatedLog,
        ...blInfo,
        generateQR,
        currentTimestamp,
        blog_ord: common.transformNLOrderNumber(result.bl.blog_ord),
        blog_date: common.formatDate(result.bl.blog_date).replace(/-/g, "."),
        blog_title_long: result.bls[lang].blog_title_long,
        blog_text: common.nlContentTransformLink(
          result.bls[lang].blog_text,
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
            <footer style="max-width: 1140px;margin: 0 auto;padding: 0 30px;font-family: 'Open Sans', sans-serif;font-weight: 400;">
              <address style="font-size: 6.5px;margin: 0;padding: 0;line-height: 1.321;color: #707070;font-style: normal;">
                ${footer}
              </address>
            </footer>`,
          },
        },
        header: {
          height: "50px",
        },
        timeout: "100000",
      };
      // Temp for testing
      // const filePath = `${__dirname}/../../../uploads/blog_create.pdf`;
      // const contents = await htmlToPdfFile(pdfHtml, options, filePath);
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
