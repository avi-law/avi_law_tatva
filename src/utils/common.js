/* eslint-disable no-param-reassign */
const neo4j = require("neo4j-driver");
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

const getCypherQueryOpt = (key, value, alias) => {
  let whereCondition = "";
  const field = key.slice(0, key.lastIndexOf("_"));
  const last = key.split("_").pop().toUpperCase();
  switch (last) {
    case "CONTAINS":
      value = value.replace(/[^\w\s]/gi, "");
      whereCondition = `toLower(${alias}.${field}) CONTAINS toLower('${value}')`;
      break;
    default:
      whereCondition = "";
      break;
  }
  return { whereCondition, field };
};

const getPropertiesFromRecord = (record, key) => {
  if (record.get(key)) {
    return record.get(key).properties;
  }
  return null;
};

const formatDate = (date) => {
  let d;
  if (typeof date === "object") {
    const { day, month, year } = date;
    d = new Date(`${year}/${month}/${day}`);
  } else {
    d = new Date();
    if (date) {
      d = new Date(date);
    }
  }
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const day = `0${d.getDate()}`.slice(-2);
  const year = d.getFullYear();
  return [day, month, year].join("-");
};

const getDateObject = (date = new Date()) => {
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const year = date.getFullYear();
  return {
    day,
    month,
    year,
    formatted: [day, month, year].join("."),
  };
};

const cleanObject = (obj) => {
  const object = obj;
  Object.keys(object).forEach((key) => {
    if (obj[key] === null || object[key] === undefined || object[key] === "") {
      delete object[key];
    }
  });
  return object;
};

const convertToTemporalDate = (date) => {
  let d;
  if (typeof date === "object") {
    const { day, month, year } = date;
    d = new Date(`${year}/${month}/${day}`);
  } else {
    d = new Date();
    if (date) {
      d = new Date(date);
    }
  }
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return new neo4j.types.Date(year, month, day);
};

const toFixedNumber = (toFixTo = 2, base = 10) => (num) => {
  const pow = base ** toFixTo;
  return +(Math.round(num * pow) / pow);
};
const amountNumberFormat = (value) =>
  value.toFixed(2).replace(".", ",").replace(" ", "");

module.exports = {
  getMessage,
  asyncForEach,
  getCypherQueryOpt,
  formatDate,
  cleanObject,
  getDateObject,
  toFixedNumber,
  amountNumberFormat,
  convertToTemporalDate,
  getPropertiesFromRecord,
};
