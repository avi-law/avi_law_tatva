/* eslint-disable no-useless-escape */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const _ = require("lodash");
const driver = require("../../../config/db");
const { common, APIError } = require("../../../utils");
const { defaultLanguage } = require("../../../config/application");

const nqTransform = (value) => {
  let final = value;
  const ids = [];
  try {
    if (final) {
      final = final.replace(/\\/g, "");
      final = final.replace("[*NQ*", "[NQ*");
      const pattern = /\[\NQ*(.*?)\]/g;
      const links =
        final && final.toString() ? final.toString().match(pattern) : "";
      if (links && links.length > 0) {
        links.forEach((data) => {
          let link = data.toString().slice();
          link = link.split("*");
          if (link && link.length > 0) {
            ids.push(Number(link[1]));
          }
        });
      }
      return ids;
    }
  } catch (error) {
    console.error("NQ transform error: ", error);
    return [];
  }
};

const getSourceListById = async (ids) => {
  const session = driver.session();
  const dbSolsStateIds = [];
  const slResult = await session.run(
    `MATCH (sl:Sol)-[:HAS_SOL_STATE]->(sls:Sol_State)
    WHERE sls.sol_id IN $ids
    RETURN sls, sl`,
    {
      ids,
    }
  );
  if (slResult && slResult.records.length > 0) {
    const solList = slResult.records.map((record) => {
      dbSolsStateIds.push(common.getPropertiesFromRecord(record, "sls").sol_id);
      const slResultArray = {
        sol_state_id: common.getPropertiesFromRecord(record, "sls").sol_id,
        sol_id: common.getPropertiesFromRecord(record, "sl").sol_id,
      };
      return slResultArray;
    });
    console.log(
      "Diffrent Of search and db recode",
      _.differenceWith(ids, dbSolsStateIds, _.isEqual)
    );
    return solList;
  }
  return [];
};

const replaceIdInContent = (nl, sourceIds) => {
  const nlMentionIds = nl.sols;
  if (nlMentionIds.length > 0) {
    nlMentionIds.forEach((nlMentionId) => {
      const mentionObj = _.find(sourceIds, { sol_state_id: nlMentionId });
      if (mentionObj) {
        const mentionIdSolId = mentionObj.sol_id;
        nl.nl_text_clone = nl.nl_text_clone.replace(
          `[*NQ*${nlMentionId}*]`,
          `[*NQ*${mentionIdSolId}*]`
        );
        nl.nl_text_clone = nl.nl_text_clone.replace(
          `[NQ*${nlMentionId}*]`,
          `[NQ*${mentionIdSolId}*]`
        );
      }
    });
  }
  return nl;
};

const updateNewsletterState = async (nls) => {
  const session = driver.session();
  try {
    await session.run(
      `MATCH (nls:Nl_State) WHERE id(nls) = ${nls.identity}
       SET nls.nl_text_clone = $nls.nl_text_clone
       RETURN nls`,
      { nls }
    );
  } catch (error) {
    console.log("Error in Newsletter identity ID - ", nls.identity);
  }
};

module.exports = async (object, params, ctx) => {
  const { user } = ctx;
  let listSolids = [];
  const systemAdmin = user.user_is_sys_admin || null;
  const userSurfLang = user.user_surf_lang || defaultLanguage;
  const session = driver.session();
  try {
    if (!systemAdmin) {
      throw new APIError({
        lang: userSurfLang,
        message: "INTERNAL_SERVER_ERROR",
      });
    }
    const nlResult = await session.run(
      `MATCH (nls:Nl_State)<-[:HAS_NL_STATE]-(nl:Nl)
      WHERE nl.nl_active = true AND (nls.nl_text_clone CONTAINS "[NQ*" OR nls.nl_text_clone CONTAINS "[*NQ")
      RETURN nl, nls`
    );
    if (nlResult && nlResult.records.length > 0) {
      const newsLettersState = nlResult.records.map((record) => {
        const solIds = nqTransform(
          common.getPropertiesFromRecord(record, "nls").nl_text_clone
        );
        listSolids.push(...solIds);
        const nlResultArray = {
          identity: record.get("nls").identity,
          sols: solIds,
          nl_text_clone: common.getPropertiesFromRecord(record, "nls")
            .nl_text_clone,
        };
        return nlResultArray;
      });
      listSolids = _.uniq(listSolids);
      const listOfSource = await getSourceListById(listSolids);

      const promises = [];
      // newsLettersState.forEach((nls) => {
      //   promises.push(
      //     new Promise((resolve, reject) => {
      //       replaceIdInContent(nls, listOfSource);
      //       return updateNewsletterState(nls)
      //         .then((info) => resolve(info))
      //         .catch((error) => {
      //           resolve(error);
      //         });
      //     })
      //   );
      //   return Promise.all(promises).then(() => true);
      // });
      return JSON.stringify(newsLettersState);
      // return newsLetters;
    }
    return true;
  } catch (error) {
    session.close();
    throw error;
  }
};
