const htmlPdf = require("html-pdf");

const htmlToPdfBuffer = (html, options) =>
  new Promise((resolve, reject) => {
    htmlPdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });

const htmlToPdfFile = (html, options, filePath) =>
  new Promise((resolve, reject) => {
    htmlPdf.create(html, options).toFile(filePath, (err, buffer) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });

module.exports = {
  htmlToPdfBuffer,
  htmlToPdfFile,
};
