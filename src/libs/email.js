const ejs = require("ejs");
const nodemailer = require("nodemailer");
const { mailSmtp } = require("../config/application");

const emailTransport = {
  host: mailSmtp.host,
  port: mailSmtp.port,
  secure: mailSmtp.secure,
  auth: {
    user: mailSmtp.user,
    pass: mailSmtp.pass,
  },
};
const transporter = nodemailer.createTransport(emailTransport);

const getTemplate = (mail, templateName) =>
  ejs
    .renderFile(`${__dirname}/../emailTemplates/${templateName}.ejs`, mail.data)
    .catch((error) => {
      console.error("Email template error: ", error);
      return false;
    });

const sendMail = (mail, templateName) => {
  let isSent = false;
  return getTemplate(mail, templateName)
    .then((htmlOutput) => {
      if (htmlOutput) {
        const mailOptions = {
          from: mailSmtp.from,
          to: mail.to,
          subject: mail.subject,
          html: htmlOutput,
        };
        return transporter
          .sendMail(mailOptions)
          .then((body) => {
            if (body) {
              isSent = true;
            }
            return body;
          })
          .catch((error) => {
            console.error("Send Email : ", error);
            return isSent;
          });
      }
      return isSent;
    })
    .catch((error) => {
      console.error("Send Email SMTP Error  : ", error);
      return isSent;
    });
};

module.exports = sendMail;
