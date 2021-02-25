/* eslint-disable no-param-reassign */

const _ = require("lodash");
const driver = require("../../../config/db");
const { common, constants, auth } = require("../../../utils");
const { frontendURL } = require("../../../config/application");
const sendMail = require("../../../libs/email");
const {
  getMultipleNewsletterDetails,
  getUsersByNewsletterPreference,
} = require("../../../neo4j/query");

const validNLEmail = [
  "praful.mali@tatvasoft.com",
  "janezic@avi-law.com",
  "praful3.mali@mailinator.com",
  "praful.mali2@mailinator.com",
];

const nlURL = `${frontendURL}${constants.NEWSLETTER_SERVICE_PATH}`;
const generateNLLink = (nl, nls, cou, lang) => {
  const link = `${nlURL}/${nl.nl_date.year}/${nl.nl_id}`;
  if (nl && nls) {
    return {
      link,
      nl_ord: common.transformNLOrderNumber(nl.nl_ord),
      cou: cou.iso_3166_1_alpha_2,
      nl_id: nl.nl_id,
      nl_date: common.formatDate(nl.nl_date).replace(/-/g, "."),
      nl_title_long: nls[lang].nl_title_long,
    };
  }
  return false;
};

const getUserList = async (nlCountry) => {
  const session = driver.session();
  try {
    const uniqueUserList = {};
    let usersList = {};
    const usersListResult = await session.run(getUsersByNewsletterPreference, {
      nlCountry,
    });
    usersList = usersListResult.records.map((record) => {
      const country = record.get("cou");
      const user = common.getPropertiesFromRecord(record, "u");
      if (country && user && country.length > 0) {
        if (!usersList[user.user_email]) {
          uniqueUserList[user.user_email] = {
            user,
            user_state: common.getPropertiesFromRecord(record, "us"),
            nl_country: _.map(country, "iso_3166_1_alpha_2"),
            pref_lang: common.getPropertiesFromRecord(record, "lang").iso_639_1,
          };
          const usersResultArray = {
            user,
            user_state: common.getPropertiesFromRecord(record, "us"),
            country,
            lang: common.getPropertiesFromRecord(record, "lang"),
          };
          return usersResultArray;
        }
      }
      return false;
    });
    session.close();
    return uniqueUserList;
  } catch (error) {
    session.close();
    return false;
  }
};

module.exports = async (params) => {
  const session = driver.session();
  const nlIds = params.nl_tags;
  const nlLinkList = {};
  const nlCountry = [];
  try {
    const newsletterListResult = await session.run(
      getMultipleNewsletterDetails,
      {
        nlIds,
      }
    );
    if (newsletterListResult && newsletterListResult.records.length > 0) {
      newsletterListResult.records.map((record) => {
        const nls = {
          de: {
            nl_text: null,
            nl_title_long: null,
            nl_title_short: null,
          },
          en: {
            nl_text: null,
            nl_title_long: null,
            nl_title_short: null,
          },
        };
        if (record.get("nls") && record.get("nls").length > 0) {
          record.get("nls").forEach((nlState) => {
            if (
              nlState.lang &&
              nlState.nls &&
              nlState.lang.properties.iso_639_1
            ) {
              nls[nlState.lang.properties.iso_639_1] = nlState.nls.properties;
            }
          });
        }
        const nl = common.getPropertiesFromRecord(record, "nl");
        const country = common.getPropertiesFromRecord(record, "cou");
        const nlENLink = generateNLLink(nl, nls, country, "en");
        const nlDELink = generateNLLink(nl, nls, country, "de");
        nlCountry.push(country.iso_3166_1_alpha_2);
        if (nlLinkList && nlLinkList[country.iso_3166_1_alpha_2]) {
          if (nlLinkList[country.iso_3166_1_alpha_2].DE) {
            nlLinkList[country.iso_3166_1_alpha_2].DE.push(nlDELink);
          } else {
            nlLinkList[country.iso_3166_1_alpha_2].DE = [nlDELink];
          }
          if (nlLinkList[country.iso_3166_1_alpha_2].EN) {
            nlLinkList[country.iso_3166_1_alpha_2].EN.push(nlENLink);
          } else {
            nlLinkList[country.iso_3166_1_alpha_2].EN = [nlENLink];
          }
        } else {
          nlLinkList[country.iso_3166_1_alpha_2] = {
            DE: [nlDELink],
            EN: [nlENLink],
          };
        }
        const nlResultArray = {
          nl,
          nls,
          country,
        };
        return nlResultArray;
      });
    }
    if (nlCountry.length > 0) {
      const usersList = await getUserList(nlCountry);
      if (Object.keys(usersList).length === 0) {
        return false;
      }
      const promises = [];
      Object.keys(usersList).forEach((user) => {
        const userDetails = usersList[user];
        if (validNLEmail.indexOf(userDetails.user.user_email) === -1) {
          return false;
        }
        const nlEmailLinks = [];
        userDetails.nl_country.forEach((cou) => {
          if (nlLinkList && nlLinkList[cou]) {
            nlEmailLinks.push(
              ...nlLinkList[cou][userDetails.pref_lang.toUpperCase()]
            );
          }
        });
        const finalOrderLink = [];
        nlIds.forEach((ids) => {
          finalOrderLink.push(
            ..._.filter(nlEmailLinks, (o) => ids === o.nl_id && o.nl_title_long)
          );
        });
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        const token = auth.generateToken({
          email: userDetails.user.user_email,
        });
        const unsubscribeLink = `${frontendURL}${constants.NEWSLETTER_UNSUBSCRIBE_PATH}/${token}`;
        promises.push(
          new Promise((resolve, reject) => {
            const recipients = userDetails.user.user_email;
            const mailOption = {
              to: recipients,
              subject: params.nles[userDetails.pref_lang].nl_email_subject,
              data: {
                currentYear,
                previousYear,
                footer: {
                  ...constants.EMAIL[userDetails.pref_lang.toUpperCase()]
                    .FOOTER,
                },
                nl_email_text_initial: common.nlContentTransformLink(
                  params.nles[
                    userDetails.pref_lang
                  ].nl_email_text_initial.toString()
                ),
                nl_email_text_final: common.nlContentTransformLink(
                  params.nles[
                    userDetails.pref_lang
                  ].nl_email_text_final.toString()
                ),
                salutation: common.getSalutation(
                  userDetails.user_state.user_sex,
                  userDetails.pref_lang
                ),
                user_first_name: userDetails.user_state.user_first_name,
                user_last_name: userDetails.user_state.user_last_name,
                nlEmailLinks: finalOrderLink,
                twitterLink: constants.TWITTER_LINK,
                unsubscribeLink,
              },
            };
            return sendMail(mailOption, "newsletter")
              .then((info) => resolve(info))
              .catch((error) => {
                reject(error);
              });
          })
        );
        return Promise.all(promises).then(() => true);
      });
      return true;
    }
    return true;
  } catch (error) {
    session.close();
    return false;
  }
};
