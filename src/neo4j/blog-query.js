const { constants } = require("../utils");

exports.blogQuery = (queryParams) => {
  let query = `
    MATCH (bl:Blog) WITH MAX(bl.blog_id) AS max_blog_id
    MATCH (u:User {user_email: $queryParams.user_email})
    MATCH (lang1:Language {iso_639_1: "de"})
    MATCH (lang2:Language {iso_639_1: "en"})`;
  if (!queryParams.isUpdate) {
    query = `
    ${query}
    MERGE (bl:Blog {blog_id: max_blog_id + 1 })
    SET bl.blog_ord = "${queryParams.bl.blog_ord}", bl.blog_date = Date({ year: ${queryParams.bl.blog_date.year}, month: ${queryParams.bl.blog_date.month} , day: ${queryParams.bl.blog_date.day}}) , bl.blog_active = ${queryParams.bl.blog_active}`;
  } else {
    query = `
    ${query}
    MATCH (bl:Blog {blog_id: ${queryParams.bl.blog_id} })
    SET bl.blog_ord = "${queryParams.bl.blog_ord}", bl.blog_date = Date({ year: ${queryParams.bl.blog_date.year}, month: ${queryParams.bl.blog_date.month} , day: ${queryParams.bl.blog_date.day}}) , bl.blog_active = ${queryParams.bl.blog_active}`;
  }

  // Set the properties for the German version of the (Blog_State) - please do it obly in case when the data-fields for the German version are filled
  // Maybe that the distinction between ON CREATE and ON MATCH is not necessary
  if (queryParams.isValidDE) {
    query = `${query}
    MERGE (bl)-[:HAS_BLOG_STATE]->(bls_de:Blog_State)-[:BLOG_LANG_IS]->(lang1)
    SET bls_de = $queryParams.bls.de`;
  } else if (!queryParams.isValidDE && queryParams.isUpdate) {
    query = `${query}
    WITH bl, u, lang1, lang2
    OPTIONAL MATCH (bl)-[:HAS_BLOG_STATE]->(bls_de:Blog_State)-[:BLOG_LANG_IS]->(lang1)
    DETACH DELETE bls_de`;
  }
  // Set the properties for the English version of the (Blog_State) - please do it obly in case when the data-fields for the English version are filled
  // Maybe that the distinction between ON CREATE and ON MATCH is not necessary
  if (queryParams.isValidEN) {
    query = `${query}
    MERGE (bl)-[:HAS_BLOG_STATE]->(bls_en:Blog_State)-[:BLOG_LANG_IS]->(lang2)
    SET bls_en = $queryParams.bls.en`;
  } else if (!queryParams.isValidEN && queryParams.isUpdate) {
    query = `${query}
    WITH bl, u, lang1, lang2
    OPTIONAL MATCH (bl)-[:HAS_BLOG_STATE]->(bls_en:Blog_State)-[:BLOG_LANG_IS]->(lang2)
    DETACH DELETE bls_en`;
  }

  if (queryParams.isUpdate) {
    query = `${query}
    WITH bl,u
    CALL {
      WITH bl
      MATCH (bl)-[r1:BLOG_HAS_AUTHOR]->()
      RETURN r1
    }
    DETACH DELETE r1`;
  }

  query = `${query}
    CREATE (bl)-[:BLOG_HAS_AUTHOR]->(u)
    RETURN bl`;

  return query;
};

exports.getBlogListCount = (condition = "") => `
MATCH (bl:Blog)-[:HAS_BLOG_STATE]->(bls:Blog_State)-[:BLOG_LANG_IS]->(lang:Language)
${condition}
RETURN count(*) as count
`;

exports.getBlogList = (
  condition,
  limit = 10,
  skip = 0,
  orderBy = "bl.bl_date DESC"
) => `
MATCH (bl:Blog)-[:HAS_BLOG_STATE]->(bls:Blog_State)-[:BLOG_LANG_IS]->(lang:Language)
${condition}
RETURN bl, bls, lang
ORDER BY ${orderBy}
SKIP toInteger(${skip})
LIMIT toInteger(${limit})
`;

exports.deleteBlog = `
MATCH (bl:Blog {blog_id: $blog_id})-[:HAS_BLOG_STATE]->(bls:Blog_State)
DETACH DELETE bl, bls
RETURN bl,bls
`;

exports.logBlog = `
MATCH (a: Log_Type {log_type_id: $type})
MATCH (b:User {user_email: $current_user_email})
MATCH (bl:Blog {blog_id: $blog_id})
MERGE (b)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(a)
MERGE (l1)-[:LOG_REFERS_TO_OBJECT]-(bl);
`;

exports.logDeleteBlog = `
MATCH (lt: Log_Type {log_type_id: $type})
MATCH (u:User {user_email: $current_user_email})
MERGE (u)<-[:LOG_FOR_USER]-(l1:Log{log_timestamp: apoc.date.currentTimestamp()})-[:HAS_LOG_TYPE]->(lt)
`;

exports.getBlog = `
MATCH (bl:Blog)-[:BLOG_HAS_AUTHOR]->(u:User)
WHERE bl.blog_id = $blog_id
CALL {
  WITH bl
  MATCH (bl)-[:HAS_BLOG_STATE]->(bls:Blog_State)-[:BLOG_LANG_IS]->(lang:Language)
  RETURN collect({ bls: bls, lang: lang }) AS bls
}
RETURN bl, bls, u
`;

exports.getBlogYearList = (queryParams) => {
  let query = `
  MATCH (bl:Blog)-[:HAS_BLOG_STATE]->(bls:Nl_State)-[r3:BLOG_LANG_IS]->(lang:Language)
  WHERE bl.blog_active = true
  `;
  if (queryParams.lang) {
    query = `${query} AND lang.iso_639_1 = "${queryParams.lang}"`;
  }
  query = `${query}
  RETURN DISTINCT bl.blog_date.year as year
  ORDER BY bl.blog_date.year DESC`;

  return query;
};

exports.getBlogListByYear = (queryParams) => {
  let query = `
  MATCH (bl:Blog)-[:HAS_BLOG_STATE]->(bls:Nl_State)-[r3:BLOG_LANG_IS]->(lang:Language)
  WHERE bl.blog_active = true
  `;
  if (queryParams.lang) {
    query = `${query} AND lang.iso_639_1 = "${queryParams.lang}"`;
  }
  if (queryParams.currentYear) {
    query = `${query} AND bl.blog_date.year = ${queryParams.currentYear}`;
  }
  query = `${query}
  OPTIONAL MATCH (user:User { user_email: "${queryParams.userEmail}"})
  RETURN bl, collect({ bls: bls, lang: lang }) as bls, user
  ORDER BY bl.blog_ord DESC`;

  return query;
};

exports.getBlogDetails = `
MATCH (bl:Blog)-[:BLOG_HAS_AUTHOR]->(u:User)
WHERE bl.blog_id = $blog_id
CALL {
  WITH bl
  MATCH (bl)-[:HAS_BLOG_STATE]->(bls:Blog_State)-[:BLOG_LANG_IS]->(lang:Language)
  RETURN collect({ bls: bls, lang: lang }) AS bls
}
CALL {
  WITH bl
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.CREATE_BLOG}})
  MATCH (nl)<-[:LOG_REFERS_TO_OBJECT]-(l1:Log)-[:HAS_LOG_TYPE]->(lt)
  MATCH (l1)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  RETURN collect({timestamp: l1.log_timestamp, user_state: {user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name} }) AS createdLog
}
CALL {
  WITH bl
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.UPDATE_BLOG}})
  MATCH (nl)<-[:LOG_REFERS_TO_OBJECT]-(l2:Log)-[:HAS_LOG_TYPE]->(lt)
  MATCH (l2)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  RETURN collect({timestamp: l2.log_timestamp, user_state: { user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name  } }) AS updatedLog
}
OPTIONAL MATCH (user:User { user_email: $user_email})
RETURN bl, bls, u, user, updatedLog, createdLog
`;

exports.getBlogLog = `
MATCH (bl:Blog)
WHERE bl.blog_id = $blog_id
CALL {
  WITH bl
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.CREATE_BLOG}})
  MATCH (nl)<-[:LOG_REFERS_TO_OBJECT]-(l1:Log)-[:HAS_LOG_TYPE]->(lt)
  MATCH (l1)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  RETURN collect({timestamp: l1.log_timestamp, user_state: {user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name} }) AS createdLog
}
CALL {
  WITH bl
  MATCH (lt: Log_Type {log_type_id: ${constants.LOG_TYPE_ID.UPDATE_BLOG}})
  MATCH (nl)<-[:LOG_REFERS_TO_OBJECT]-(l2:Log)-[:HAS_LOG_TYPE]->(lt)
  MATCH (l2)-[:LOG_FOR_USER]->(editor:User)-[r1:HAS_USER_STATE]-(us1:User_State)
  WHERE r1.to IS NULL
  RETURN collect({timestamp: l2.log_timestamp, user_state: { user_first_name: us1.user_first_name, user_middle_name: us1.user_middle_name, user_last_name: us1.user_last_name  } }) AS updatedLog
}
RETURN updatedLog, createdLog
`;

exports.tweetBlog = `
MATCH ( bl:Blog { blog_id: $blog_id })
SET bl.blog_tweeted = TRUE
RETURN bl
`;
