const { pool } = require('./mysql');

const getVault = async (userID, vaultID) => {
  try {
    let [users] = await pool.query(
      `SELECT vault_id FROM vault_user
      WHERE user_id = ? and vault_id = ?`,
      [userID, vaultID]
    );
    if (users.length < 1) {
      return { error: 'Permission Denied' };
    }
    [users] = await pool.query(
      `SELECT vaults.name, users.email
    FROM vault_user JOIN vaults 
    on vault_user.vault_id = vaults.id
    JOIN users on users.id = vault_user.user_id
    WHERE vault_user.vault_id = ?`,
      [vaultID]
    );
    return { users };
  } catch (error) {
    console.log(error);
    return { error };
  }
};
const createVault = async (userID, createdAt, name) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('START TRANSACTION');
    const [result] = await conn.query(
      'INSERT INTO vaults (name, created_at) VALUES (?, ?)',
      [name, createdAt]
    );
    await conn.query(
      'INSERT INTO vault_user (vault_id, user_id) VALUES (?, ?)',
      [result.insertId, userID]
    );
    await conn.query('COMMIT');
    return { id: result.insertId };
  } catch (error) {
    await conn.query('ROLLBACK');
    console.log(error);
    return { error };
  } finally {
    conn.release();
  }
};

const addVaultUser = async (userID, vaultID, emails) => {
  const conn = await pool.getConnection();
  try {
    let [user] = await conn.query(
      `SELECT vault_id FROM vault_user
      WHERE user_id = ? and vault_id = ?`,
      [userID, vaultID]
    );
    if (user.length < 1) {
      return { error: 'Permission Denied' };
    }
    await conn.query('START TRANSACTION');
    await conn.query(
      'INSERT IGNORE INTO users (email, last_entered_vault_id) VALUES ?',
      [emails.map((email) => [email, vaultID])]
    );
    let [users] = await conn.query('SELECT id FROM users WHERE email in (?)', [
      emails
    ]);
    await conn.query(
      'INSERT IGNORE INTO vault_user (vault_id, user_id) VALUES ?',
      [users.map((user) => [vaultID, user.id])]
    );
    await conn.query('COMMIT');
    return {};
  } catch (error) {
    await conn.query('ROLLBACK');
    console.log(error);
    return { error };
  } finally {
    conn.release();
  }
};
const changeVaultName = async (userID, vaultID, name) => {
  const conn = await pool.getConnection();
  try {
    let [user] = await conn.query(
      `SELECT vault_id FROM vault_user
      WHERE user_id = ? and vault_id = ?`,
      [userID, vaultID]
    );
    if (user.length < 1) {
      return { error: 'Permission Denied' };
    }
    await conn.query(`UPDATE vaults SET name = ? WHERE id = ?`, [
      name,
      vaultID
    ]);
    return {};
  } catch (error) {
    console.log(error);
    return { error };
  } finally {
    conn.release();
  }
};

module.exports = {
  getVault,
  createVault,
  addVaultUser,
  changeVaultName
};
