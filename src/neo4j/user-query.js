const { constants } = require("../utils");

exports.getUserHistoryLogs = `
MATCH (lt:Log_Type)<-[:HAS_LOG_TYPE]-(l:Log)-[:LOG_FOR_USER]->(u:User {user_email: $user_email})
WHERE NOT (l)<-[:USER_LOG_PREDECESSOR]-(:Log)
OPTIONAL MATCH (l)-[:LOG_REFERS_TO_OBJECT]->(n)
WITH { log: properties(l), lt: properties(lt), data: n } as logs
RETURN logs
`;
