const { constants } = require("../utils");

exports.getUserHistoryLogs = `
MATCH (log:Log)-[:LOG_FOR_USER]->(u:User {user_email: $user_email})
WHERE NOT (log)<-[:USER_LOG_PREDECESSOR]-(:Log)
WITH log
MATCH (log:Log)-[:USER_LOG_PREDECESSOR*0..19]->(log3:Log)-[:LOG_REFERS_TO_OBJECT]-(obj)
MATCH (lt:Log_Type)<-[:HAS_LOG_TYPE]-(log3)
WITH collect({ log: properties(log3), lt: properties(lt), data: obj }) as logs
RETURN logs
`;
