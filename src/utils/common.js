const constants = require("./constants");
/**
 * get message
 *
 * @param messageKey
 * @param data
 * @returns {*}
 */
const getMessage = (messageKey, lang = "en") => {
  const currentLang = lang.toUpperCase();
  let message = constants.MESSAGE.EN[messageKey];
  if (
    constants.MESSAGE[currentLang] &&
    constants.MESSAGE[currentLang][messageKey]
  ) {
    message = constants.MESSAGE[currentLang][messageKey];
  }
  if (message) {
    return { message, statusCode: messageKey };
  }
  return { message: messageKey };
};

/**
 * Async Foreach
 *
 * @param array
 * @param callback
 * @memberof Helper
 */
const asyncForEach = async (array, callback, thisArg) => {
  const promiseArray = [];
  for (let i = 0; i < array.length; i += 1) {
    if (i in array) {
      const p = Promise.resolve(array[i]).then((currentValue) =>
        callback.call(thisArg || this, currentValue, i, array)
      );
      promiseArray.push(p);
    }
  }
  await Promise.all(promiseArray);
};

const getCypherQueryOpt = (key) => {
  const field = key.slice(0, key.lastIndexOf("_"));
  const last = key.split("_").pop().toUpperCase();
  let opt = "=";
  switch (last) {
    case "CONTAINS":
      opt = "CONTAINS";
      break;
    default:
      opt = "=";
      break;
  }
  return { field, opt };
};

module.exports = {
  getMessage,
  asyncForEach,
  getCypherQueryOpt,
};
