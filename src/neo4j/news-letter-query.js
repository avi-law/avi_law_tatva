exports.getNewsLettersCount = (condition = "") => `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:HAS_NL_STATE]->(nls:Nl_State)
${condition}
RETURN count(distinct nl) as count`;

exports.getNewsLetters = (
  condition,
  limit = 10,
  skip = 0,
  orderBy = "nl.nl_ord DESC"
) => `
MATCH (cou:Country)<-[:NL_REFERS_TO_COUNTRY]-(nl:Nl)-[:HAS_NL_STATE]->(nls:Nl_State)
${condition}
CALL {
  WITH nl
  MATCH (nl)-[:HAS_NL_STATE]->(nls:Nl_State)-[:NL_LANG_IS]->(lang:Language)
  RETURN collect({ nls: nls, lang: lang }) AS nlState
}
RETURN distinct nl, nlState as nls, cou
ORDER BY ${orderBy}
SKIP toInteger(${skip})
LIMIT toInteger(${limit})`;
