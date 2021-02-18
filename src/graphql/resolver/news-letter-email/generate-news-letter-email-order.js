/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const driver = require("../../../config/db");

module.exports = async () => {
  const d = new Date();
  const year = d.getFullYear();
  let session;
  let total;
  let lastNumber = 1;
  try {
    session = driver.session();
    const query = `
      MATCH (nle:Nl_Email)
      WHERE toLower(nle.nl_email_ord) CONTAINS toLower("${year}")
      RETURN nle.nl_email_ord as order
      ORDER BY nle.nl_email_ord DESC
      LIMIT 1`;
    const result = await session.run(query);
    if (result && result.records.length > 0) {
      const singleRecord = result.records[0];
      total = singleRecord.get("order");
      lastNumber = +total.split("_")[1];
      lastNumber += 1;
    }
    const order = `00${lastNumber}`.slice(-3);
    return `${year}_${order}`;
  } catch (error) {
    if (session) {
      session.close();
    }
    return `${year}_001`;
  }
};
