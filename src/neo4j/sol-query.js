exports.getSolType = `
MATCH path=(st1:Sol_Type)-[:HAS_SOL_TYPE_CHILD*0..]->(st2:Sol_Type)-[:SOL_TYPE_STEMS_FROM_COUNTRY]->(cou:Country)
WHERE st1.sol_type_desc = 'Sol root object'
WITH COLLECT(path) AS paths
CALL apoc.convert.toTree(paths) YIELD value
RETURN value`;
