class APIError extends Error {
  constructor({ lang, message }) {
    const fullMsg = `${lang}: ${message}`;

    super(fullMsg);
    this.lang = lang;
    this.message = message;
  }
}

module.exports = APIError;
