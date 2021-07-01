const { constants } = require("../utils");

exports.getUserHistoryLogsOld = `
MATCH (u:User { user_email: $user_email })<-[:LOG_FOR_USER]-(log:Log)-[:HAS_LOG_TYPE]->(lt:Log_Type)
WITH * ORDER BY log.log_timestamp DESC
CALL {
  WITH *
  MATCH (log)-[:LOG_REFERS_TO_OBJECT]->(n)
  RETURN CASE
          WHEN lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE} AND LABELS(n)[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT_STATE}"
            THEN  { rule_element_title: n.rule_element_title, rule_element_article: n.rule_element_article }
            ELSE properties(n)
          END AS n
}
WITH { log: properties(log), lt: properties(lt), n: n } as logs
// WITH collect({ log: properties(log), lt: properties(lt), n: n }) as logs
RETURN logs
LIMIT 20
`;

exports.getUserHistoryLogs = `
MATCH (lt:Log_Type)<-[:HAS_LOG_TYPE]-(l:Log)-[:LOG_FOR_USER]->(u:User {user_email: $user_email})
// WHERE NOT (l)-[:USER_LOG_PREDECESSOR]->(:Log)
CALL {
  WITH *
  OPTIONAL MATCH (l)-[:LOG_REFERS_TO_OBJECT]->(n)
  RETURN CASE
          WHEN n IS NOT NULL
            THEN
              CASE
                WHEN lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE} AND LABELS(n)[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT_STATE}"
                  THEN  { identity: id(n), rule_element_title: n.rule_element_title, rule_element_article: n.rule_element_article }
                  ELSE properties(n)
                END
            ELSE NULL
          END AS n
}
WITH { log: properties(l), lt: properties(lt), data: n } as logs
RETURN logs
LIMIT 1
`;
