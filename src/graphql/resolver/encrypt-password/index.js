/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const driver = require("../../../config/db");
const { auth, common } = require("../../../utils");

const getUsersQuery = `MATCH (us:User_State) WHERE us.user_pwd_old IS NOT NULL RETURN { user_email: us.user_email, user_pwd:us.user_pwd, user_pwd_old:us.user_pwd_old } As users`;
// const getUsersQuery = `MATCH (us:User_State) WHERE us.user_email IN ["test@test.de", "janezic@avi-law.com"] RETURN { user_email: us.user_email, user_pwd:us.user_pwd, user_pwd_old:us.user_pwd_old } As users`;
const updateEncryptPassword = `
UNWIND $usersPasswordEncrypted AS user
MERGE (us:User_State { user_email: user.user_email } )
SET us.user_pwd = user.user_pwd
RETURN count(us) As count;`;

/**
 * Perform batched operation in database
 *
 * @param list - list of cart Item
 * @param callback - callback function name
 * @param chunkSize - size of chunk
 * @param msDelayBetweenChunks - microsecond delay between insert chunk of data
 */
const batchedAsync = async (
  list,
  callback,
  chunkSize = 10,
  msDelayBetweenChunks = 0
) => {
  try {
    const emptyList = new Array(Math.ceil(list.length / chunkSize)).fill();
    const clonedList = list.slice(0);
    const chunks = emptyList.map(() => clonedList.splice(0, chunkSize));
    for (const chunk of chunks) {
      if (msDelayBetweenChunks) {
        await new Promise((resolve) =>
          setTimeout(resolve, msDelayBetweenChunks)
        );
      }
      await callback(chunk, chunks);
    }
    return true;
  } catch (err) {
    console.log("Error in batched async", err);
    return false;
  }
};

const batchUpdate = async (chunk, chunks) => {
  const session = driver.session();
  const UnprocessedItems = await session
    .run(updateEncryptPassword, { usersPasswordEncrypted: chunk })
    .then(() => session.close())
    .catch(async () => {
      if (chunk && chunk.length > 1) {
        await batchedAsync(chunk, batchUpdate, 1);
      }
      session.close();
      return false;
    });
  chunks.push(UnprocessedItems);
};

module.exports = async (object, params) => {
  const limit = params.limit || 100;
  const session = driver.session();
  try {
    const usersPasswordEncrypted = [];
    const result = await session.run(getUsersQuery, params);
    if (result && result.records) {
      const users = result.records.map((record) => record.get("users"));
      if (users.length > 0) {
        await common.asyncForEach(users, async (user) => {
          if (user.user_email) {
            const encryptPassword = await auth.hashPassword(user.user_pwd_old);
            usersPasswordEncrypted.push({
              ...user,
              user_pwd: encryptPassword,
            });
          }
        });
        if (usersPasswordEncrypted.length > 0) {
          await batchedAsync(usersPasswordEncrypted, batchUpdate, limit);
          return true;
        }
      }
      return false;
    }
    throw new Error(common.getMessage("INVALID_REQUEST"));
  } catch (error) {
    session.close();
    throw error;
  }
};
