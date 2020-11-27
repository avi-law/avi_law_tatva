const constants  = require('./constants');
/**
 * get message
 *
 * @param messageKey
 * @param data
 * @returns {*}
 */
const getMessage = (messageKey, lang = 'en') => {
  lang = lang.toUpperCase();
  let message = constants.MESSAGE.EN[messageKey];
  if(constants.MESSAGE[lang] && constants.MESSAGE[lang][messageKey]) {
    message = constants.MESSAGE[lang][messageKey];
  }
  if (message) {
    return message;
  }
  return messageKey;
};

module.exports = {
  getMessage
};