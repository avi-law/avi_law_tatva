/* eslint-disable consistent-return */
const driver = require("../../../config/db");
const { common } = require("../../../utils");
const { getBlog } = require("../../../neo4j/blog-query");

module.exports = async (object, params) => {
  const blogId = params.blog_id;
  const session = driver.session();
  try {
    const result = await session.run(getBlog, { blog_id: blogId });
    if (result && result.records.length > 0) {
      const blogs = result.records.map((record) => {
        const bls = {
          de: {
            blog_text: null,
            blog_title_long: null,
            blog_title_short: null,
          },
          en: {
            blog_text: null,
            blog_title_long: null,
            blog_title_short: null,
          },
        };
        if (record.get("bls") && record.get("bls").length > 0) {
          record.get("bls").forEach((blState) => {
            if (
              blState.lang &&
              blState.bls &&
              blState.lang.properties.iso_639_1
            ) {
              bls[blState.lang.properties.iso_639_1] = blState.bls.properties;
            }
          });
        }
        const blResult = {
          bl: common.getPropertiesFromRecord(record, "bl"),
          bls,
          blog_author: common.getPropertiesFromRecord(record, "u"),
        };
        return blResult;
      });
      return blogs[0];
    }
    return null;
  } catch (error) {
    session.close();
    throw error;
  } finally {
    session.close();
  }
};
