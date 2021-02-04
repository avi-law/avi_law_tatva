const driver = require("../../../config/db");

module.exports = async (object, params) => {
  const userEmail = params.user_email;
  const { entitled, admin, specCount } = params;
  const session = driver.session();
  try {
    let set = "";
    let remove = "";
    if (typeof entitled === "boolean") {
      if (entitled) {
        set = `SET r1.from = apoc.date.currentTimestamp()`;
        remove = `REMOVE r1.to`;
      } else {
        set = `SET r1.to = apoc.date.currentTimestamp()`;
      }
    } else if (typeof admin === "boolean") {
      if (admin) {
        set = `SET r1.user_is_cust_admin = TRUE`;
      } else {
        remove = `REMOVE r1.user_is_cust_admin`;
      }
    } else if (typeof specCount === "boolean") {
      if (specCount) {
        set = `SET r1.cust_spec_cont = TRUE`;
      } else {
        remove = `REMOVE r1.cust_spec_cont`;
      }
    } else {
      return false;
    }
    const query = `MATCH (u:User)-[r1:USER_TO_CUSTOMER]->(c:Customer) WHERE u.user_email = "${userEmail}" ${set} ${remove} RETURN u`;
    const result = await session.run(query);
    if (result && result.records.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    session.close();
    throw error;
  }
};
