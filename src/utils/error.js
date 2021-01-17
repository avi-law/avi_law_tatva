class APIError extends Error {
  constructor({ lang, message, type }) {
    const fullMsg = `${lang}: ${message}`;

    super(fullMsg);
    this.lang = lang;
    this.message = message;
    this.type = type;
  }
}

module.exports = APIError;
