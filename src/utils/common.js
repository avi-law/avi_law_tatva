/* eslint-disable no-param-reassign */
const neo4j = require("neo4j-driver");
const driver = require("../config/db");
const constants = require("./constants");
const { frontendURL } = require("../config/application");
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

const loggingData = (query, data) => {
  const session = driver.session();
  try {
    return session
      .run(query, data)
      .then(() => {
        session.close();
        return true;
      })
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    session.close();
    console.log("Logging Error", error.message);
    return false;
  }
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
      value = value.replace(constants.SEARCH_EXCLUDE_SPECIAL_CHAR_REGEX, "");
      whereCondition = `toLower(${alias}.${field}) CONTAINS toLower('${value}')`;
      break;
    default:
      whereCondition = "";
      break;
  }
  return { whereCondition, field };
};

const getPropertiesFromRecord = (record, key) => {
  if (record.keys.indexOf(key) !== -1 && record.get(key)) {
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

const getSalutation = (gender, lang) =>
  constants.EMAIL[lang.toUpperCase()].SALUTATION[gender.toUpperCase()];

const getNeo4jDateType = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return new neo4j.types.Date(year, month, day);
};

const transformNLOrderNumber = (value) => {
  if (value) {
    const noFormat = value.split("_");
    if (noFormat[1]) {
      noFormat[1] = noFormat[1].replace(/^0+/, "");
      return `${noFormat[1]}/${noFormat[0]}`;
    }
  }
  return value;
};

const nlContentTransformLink = (value, hrefOptions = []) => {
  let final = value;
  let href = constants.NEWSLETTER_SERVICE_PATH;
  const pattern = constants.NL_CONTENT_TRANSFORM_LINK_REGEX;
  let link = value && value.toString() ? value.toString().match(pattern) : "";
  if (link && link.length && link[1]) {
    link = link[1].split("*");
    if (link && link.length) {
      let year =
        link[1] && link[1].split("/") && link[1].split("/").length
          ? link[1].split("/")[1]
          : "";
      year = year ? year.match(/\d/g) : "";
      year = year && year.length ? year.join("") : "";
      const id = link[0];
      const content = link[1];
      if (year) {
        href += `/${year}`;
      }
      if (id) {
        href += `/${id}`;
      }
      const anchor = `<a style="color: #029fdb;" href="${frontendURL}${href}">${content}</a>`;
      final = value.toString().replace(pattern, anchor);
    }
  }
  const lPattern = constants.NL_CONTENT_TRANSFORM_REFERENCE_LINK_REGEX;
  let lLink = final && final.toString() ? final.toString().match(lPattern) : "";
  if (lLink && lLink.length && lLink[1]) {
    lLink = lLink[1].split("*");
    if (lLink && lLink.length && hrefOptions && hrefOptions.length > 0) {
      const id = Number(lLink[0]);
      const content = lLink[1];
      const findObj = hrefOptions.find((o) => o.link_ord === id);
      if (findObj) {
        const anchor = `<a href="${findObj.link_url}" target="_blank">${content}</a>`;
        final = final.toString().replace(lPattern, anchor);
      }
    }
  }
  return final;
};

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
  getSalutation,
  loggingData,
  getNeo4jDateType,
  transformNLOrderNumber,
  nlContentTransformLink,
};
