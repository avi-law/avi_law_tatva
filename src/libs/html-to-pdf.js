const htmlPdf = require('html-pdf');

const htmlToPdfBuffer = (html, options) => {
  return new Promise((resolve, reject) => {
    htmlPdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
};

module.exports = {
  htmlToPdfBuffer
};
