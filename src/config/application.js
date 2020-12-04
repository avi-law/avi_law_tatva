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
};
