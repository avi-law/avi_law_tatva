/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");

module.exports = async () => {
  const d = new Date();
  const year = d.getFullYear();
  let session;
  let total;
  try {
    session = driver.session();
    const query = `
      MATCH (nle:Nl_Email)
      WHERE toLower(nle.nl_email_ord) CONTAINS toLower("${year}")
      RETURN Count(nle) as count`;
    const countResult = await session.run(query);
    if (countResult && countResult.records.length > 0) {
      const singleRecord = countResult.records[0];
      total = singleRecord.get("count");
    }
    total += 1;
    const order = `00${total}`.slice(-3);
    return `${year}_${order}`;
  } catch (error) {
    if (session) {
      session.close();
    }
    return `${year}_001`;
  }
};
