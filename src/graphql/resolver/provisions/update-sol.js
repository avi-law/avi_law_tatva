/* eslint-disable no-param-reassign */

const driver = require("../../../config/db");
const { APIError, common } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");
const { solQuery } = require("../../../neo4j/query");

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  const systemAdmin = user.user_is_sys_admin || null;
  const userIsAuthor = user.user_is_author || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const userEmail = user.user_email || null;
  const session = driver.session();
  params = JSON.parse(JSON.stringify(params));
  const { data } = params;
  const solID = params.sol_id;
  let isValidDE = false;
  let isValidEN = false;
  try {
    if (!systemAdmin && !userIsAuthor) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    if (data.sls) {
      if (data.sls.de) {
        data.sls.de = common.cleanObject(data.sls.de);
      }
      if (data.sls.de) {
        data.sls.en = common.cleanObject(data.sls.en);
      }
    }

    if (data.sls && data.sls.de.sol_name_01) {
      isValidDE = true;
    }
    if (data.sls && data.sls.en.sol_name_01) {
      isValidEN = true;
    }
    const queryParams = {
      sol_id: solID,
      isUpdate: true,
      user_email: userEmail,
      sl: data.sl,
      sls: data.sls,
      sol_type_id: data.sol_type_id,
      isValidDE,
      isValidEN,
    };
    const result = await session.run(solQuery(queryParams), {
      queryParams,
    });
    if (result && result.records.length > 0) {
      return true;
    }
    throw new APIError({
      lang: userSurfLang,
      message: "INTERNAL_SERVER_ERROR",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
