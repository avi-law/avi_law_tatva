const { constants } = require("../utils");

exports.getUserHistoryLogs = `
MATCH (u:User { user_email: $user_email })<-[:LOG_FOR_USER]-(log:Log)-[:HAS_LOG_TYPE]->(lt:Log_Type)
CALL {
  WITH *
  MATCH (log)-[:LOG_REFERS_TO_OBJECT]->(n)
  RETURN CASE
          WHEN lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE} AND LABELS(n)[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT_STATE}"
            THEN  { rule_element_title: n.rule_element_title, rule_element_article: n.rule_element_article }
            ELSE properties(n)
          END AS n
}
WITH * ORDER BY log.log_timestamp DESC
WITH collect({ log: properties(log), lt: properties(lt), n: n }) as logs
RETURN logs
LIMIT 10
`;
