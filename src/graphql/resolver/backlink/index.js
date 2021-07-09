/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
const _ = require("lodash");
const driver = require("../../../config/db");
const { defaultLanguage } = require("../../../config/application");
const { common, APIError } = require("../../../utils");

const getRuleElementStateOld = `
MATCH (res:Rule_Element_State)
WHERE NOT (res)<-[:IS_BACKLINKED_FROM]-() AND res.rule_element_text IS NOT NULL AND size(res.rule_element_text) > 0 AND res.rule_element_text CONTAINS '"[*'
RETURN { identity: id(res), rule_element_text: res.rule_element_text } As res
SKIP toInteger($offset)
LIMIT toInteger($limit)`;

const getRuleElementState = `
MATCH (res:Rule_Element_State)
WHERE res.rule_element_text IS NOT NULL AND size(res.rule_element_text) > 0 AND (res.rule_element_text CONTAINS '"[*Part_26_0050*]' OR
res.rule_element_text CONTAINS '"[*Part_26_0105*]' OR
res.rule_element_text CONTAINS '"[*Part_26_0110*]' OR
res.rule_element_text CONTAINS '"[*Part_26_0120*]' OR
res.rule_element_text CONTAINS '"[*Part_26_0150*]' OR
res.rule_element_text CONTAINS '"[*Part_26_0155*]' OR
res.rule_element_text CONTAINS '"[*Part_26_0160*]' OR
res.rule_element_text CONTAINS '"[*Part_26_0200*]' OR
res.rule_element_text CONTAINS '"[*Part_26_0250*]' OR
res.rule_element_text CONTAINS '"[*VO_EG_2004_0552_Anh_01*]' OR
res.rule_element_text CONTAINS '"[*VO_EG_2004_0552_Anh_02*]' OR
res.rule_element_text CONTAINS '"[*Part_145_A_0030_e_B_0010_3_AMC_Anl_04*]' OR
res.rule_element_text CONTAINS '"[*AUT_15a_Tirol_HS_0002*]')
RETURN { identity: id(res), rule_element_text: res.rule_element_text } As res`;

const updateBacklink = `
UNWIND $backlink as re1
MATCH (res:Rule_Element_State) WHERE id(res) = re1.identity
MATCH (re:Rule_Element) WHERE re.rule_element_doc_id IN re1.rule_element_doc_id
OPTIONAL MATCH (res)<-[r1:IS_BACKLINKED_FROM]-()
// FOREACH (_ IN CASE WHEN r1 IS NOT NULL THEN [1] END | DELETE r1)
// FOREACH (_ IN CASE WHEN re IS NOT NULL AND res IS NOT NULL THEN [1] END | MERGE (re)-[:IS_BACKLINKED_FROM]->(res))
RETURN re, res`;

const batchedAsync = async (
  list,
  callback,
  chunkSize = 100,
  msDelayBetweenChunks = 1000
) => {
  try {
    const emptyList = new Array(Math.ceil(list.length / chunkSize)).fill();
    const clonedList = list.slice(0);
    const chunks = emptyList.map(() => clonedList.splice(0, chunkSize));
    for (const chunk of chunks) {
      if (msDelayBetweenChunks) {
        await new Promise((resolve) =>
          setTimeout(resolve, msDelayBetweenChunks)
        );
      }
      await callback(chunk, chunks);
    }
    return true;
  } catch (err) {
    console.log("Error in batched async", err);
    return false;
  }
};

const batchUpdate = (chunk, chunks) => {
  const session = driver.session();
  return session
    .run(updateBacklink, { backlink: chunk })
    .then(() => session.close())
    .catch((error) => {
      console.log(error);
      session.close();
      return false;
    });
  // chunks.push(UnprocessedItems);
  // console.log(updateBacklink);
  // console.log(chunk);
  // session.close();
};

module.exports = async (object, params) => {
  params = JSON.parse(JSON.stringify(params));
  const offset = params.offset || 0;
  const limit = params.first || 1000;
  const session = driver.session();
  const backlink = [];
  try {
    console.log("limit ->", limit, ": offset ->", offset);
    const result = await session.run(getRuleElementState, {
      limit,
      offset,
    });
    if (result && result.records.length > 0) {
      result.records.forEach((record) => {
        const res = record.get("res");
        if (res) {
          const obj = {
            identity: _.get(res, "identity", null),
            rule_element_doc_id: common.getRuleElementDocIdFromState(
              _.get(res, "rule_element_text", "")
            ),
          };
          if (obj.rule_element_doc_id.length > 0) {
            backlink.push(obj);
          }
          // Array of rule element
          // const backlinkArray = common.getRuleElementDocIdFromState(
          //   _.get(res, "rule_element_text", "")
          // );
          // if (backlinkArray && backlinkArray.length > 0) {
          //   backlinkArray.forEach((link) => {
          //     const obj = {
          //       identity: _.get(res, "identity", null),
          //       rule_element_doc_id: link,
          //     };
          //     if (obj.rule_element_doc_id.length > 0) {
          //       backlink.push(obj);
          //     }
          //   });
          // }
        }
      });
      if (backlink.length > 0) {
        // const uni = _.sortedUniq(backlink);
        // console.log(uni);
        console.log("backlink.length >>>", backlink.length);
        // return batchedAsync(backlink, batchUpdate);
        return true;
      }
      return true;
    }
    throw new APIError({
      lang: defaultLanguage,
      message: "INVALID_REQUEST",
    });
  } catch (error) {
    session.close();
    throw error;
  }
};
