/* eslint-disable no-param-reassign */
const driver = require("../../../config/db");
const { APIError, common, constants } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const {
  updateHiTechRuleElementStateQuery,
  logRuleElementState,
} = require("../../../neo4j/rule-element-query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userIsHitech = user.user_is_hitech || false;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { data } = params;
  let isValidDE = false;
  let isValidEN = false;
  try {
    if (!userIsHitech) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (
      data.res &&
      data.res.de &&
      (data.res.de.rule_element_title || data.res.de.rule_element_article) &&
      data.res.de.identity // If you want to create new now at a time of update please remove this but need to change query
    ) {
      isValidDE = true;
    }
    if (
      data.res &&
      data.res.en &&
      (data.res.en.rule_element_title || data.res.en.rule_element_article) &&
      data.res.en.identity // If you want to create new now at a time of update please remove this but need to change query
    ) {
      isValidEN = true;
    }

    const queryParams = {
      isUpdate: true,
      isValidEN,
      isValidDE,
      res: data.res,
    };
    // console.log(queryParams);
    // console.log(updateHiTechRuleElementStateQuery(queryParams));
    // return true;
    const result = await session.run(
      updateHiTechRuleElementStateQuery(queryParams),
      {
        queryParams,
      }
    );
    // console.log(result);
    if (result && result.records.length > 0) {
      const identity = [];
      result.records.forEach((record) => {
        if (queryParams.isValidEN && queryParams.isValidDE) {
          const enId = record.get("res_en");
          const deId = record.get("res_de");
          identity.push(deId.identity);
          identity.push(enId.identity);
        } else if (queryParams.isValidEN) {
          const enId = record.get("res_en");
          identity.push(enId.identity);
        } else if (queryParams.isValidDE) {
          const deId = record.get("res_de");
          identity.push(deId.identity);
        }
      });
      if (identity.length > 0) {
        common.loggingData(logRuleElementState, {
          type: constants.LOG_TYPE_ID.UPDATE_RULE_ELEMENT_AND_STATE,
          current_user_email: userEmail,
          identity,
        });
      }
      return true;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
