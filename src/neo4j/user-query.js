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

exports.getUserHistoryLogsOld = `
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
                  THEN
                  [
                    MATCH (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element)-[:HAS_RULE_ELEMENT_STATE]->(n)
                  return { identity: id(n), rule_element_title: n.rule_element_title, rule_element_article: n.rule_element_article }
                ]
                  ELSE properties(n)
                END
            ELSE NULL
          END AS n
}
WITH { log: properties(l), lt: properties(lt), data: n } as logs
RETURN logs
LIMIT 1
`;
exports.getUserHistoryLogs = `
MATCH (lt:Log_Type)<-[:HAS_LOG_TYPE]-(l:Log)-[:LOG_FOR_USER]->(u:User {user_email: $user_email})
// WHERE NOT (l)-[:USER_LOG_PREDECESSOR]->(:Log)
OPTIONAL MATCH (l)-[:LOG_REFERS_TO_OBJECT]->(n)
CALL apoc.do.case([
  lt.log_type_id = ${constants.LOG_TYPE_ID.READ_RULE_ELEMENT_AND_STATE} AND LABELS(n)[0] = "${constants.LOG_REFERS_TO_OBJECT_LABEL.RULE_ELEMENT_STATE}",
    "MATCH (rb:Rule_Book)-[:HAS_RULE_BOOK_ISSUE]->(rbi:Rule_Book_Issue)-[:HAS_RULE_BOOK_ISSUE_STATE]->(rbis:Rule_Book_Issue_State)-[:RULE_BOOK_ISSUE_LANGUAGE_IS]->(lang:Language)
     MATCH(rbi)-[:HAS_RULE_ELEMENT*]->(re:Rule_Element)-[:HAS_RULE_ELEMENT_STATE]->(n)
     WITH collect({rule_book_issue_title_short: rbis.rule_book_issue_title_short, iso_639_1: lang.iso_639_1 }) as rbis, n, re
     RETURN { identity: id(n), rule_element_title: n.rule_element_title, rule_element_article: n.rule_element_article, rule_element_doc_id: re.rule_element_doc_id, rbis: rbis } as data
    "
])
YIELD value
WITH { log: properties(l), lt: properties(lt), data: value.data } as logs
RETURN logs
LIMIT 1
`;
