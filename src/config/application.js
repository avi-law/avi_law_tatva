const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  // Application environment configuration
  port: process.env.PORT || 4000,
  environment: process.env.NODE_ENV || "development",

  defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",

  // JWT token for authentication
  jwtSecret: process.env.JWT_SECRET || "secret",
  jwtExpiresIn: process.env.JWT_EXPIRED_IN || "1d",

  websiteOwnerEmail: process.env.WEBSITE_OWNER_EMAIL || "janezic@avi-law.com",
  carbonCopyEmail: process.env.CARBON_COPY_EMAIL || "janezic@avi-law.com",
  blindcarbonCopyEmail:
    process.env.BLIND_CARBON_COPY_EMAIL || "klein@luftverkehr.de",

  /** SMTP */
  mailSmtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },

  // Frontend configuration
  frontendURL: process.env.FRONTEND_URL,
  logo: process.env.LOGO,
};
