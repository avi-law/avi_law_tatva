const dotenv = require("dotenv");

dotenv.config();

const corsConfig = {
  origin: (origin, callback) => {
    const arrayOfOrigin = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : [];
    // if API call from same origin then the origin return undefined
    if (origin === undefined || arrayOfOrigin.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("CORS header origin cannot be added"));
    }
  },
  exposedHeaders: ["X-Response-Time"],
};

module.exports = {
  // Application environment configuration
  port: process.env.PORT || 4000,
  environment: process.env.NODE_ENV || "development",

  defaultLanguage: process.env.DEFAULT_LANGUAGE || "en",
  corsConfig,
  // JWT token for authentication
  jwtSecret: process.env.JWT_SECRET || "secret",
  jwtExpiresIn: process.env.JWT_EXPIRED_IN || "1d",
  jwtAlgorithms: process.env.JWT_ALGORITHMS || "HS256",

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
  bothLogo: process.env.BOTH_LOGO,
};
