const { pool } = require('./mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
const JWT_KEY = process.env.JWT_KEY;

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, SALT_ROUNDS, (error, hash) => {
      if (error) {
        return reject(error.message);
      }
      return resolve(hash);
    });
  });
};
const comparePassword = (password, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (error, isSame) => {
      if (error) {
        return reject(error.message);
      }
      return resolve(isSame);
    });
  });
};
const signUp = async (name, email, password) => {
  const conn = await pool.getConnection();
  try {
    const hash = await hashPassword(password);
    await conn.query('START TRANSACTION');
    const users = await conn.query(
      'SELECT id, email, is_registered, last_entered_vault_id FROM users WHERE email = ? FOR UPDATE',
      [email]
    );
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let user, id, vaultID;
    if (users[0].length > 0) {
      [user] = users[0];
      if (user.is_registered == 1) {
        await conn.query('COMMIT');
        return { error: 'Email already exists' };
      }
      id = user.id;
      vaultID = user.last_entered_vault_id;
      await conn.query(
        'UPDATE users SET name = ?, password = ?,is_registered = 1 WHERE id = ?',
        [name, hash, id]
      );
    } else {
      const [vault] = await conn.query(
        'INSERT INTO vaults (name, created_at) VALUES (?, ?)',
        ['Default', createdAt]
      );
      vaultID = vault.insertId;
      const [result] = await conn.query(
        'INSERT INTO users (name, email, password, last_entered_vault_id, is_registered) VALUES (?, ?, ?, ?, 1)',
        [name, email, hash, vaultID]
      );
      id = result.insertId;
      await conn.query(
        'INSERT INTO vault_user (vault_id, user_id) VALUES (?, ?)',
        [vaultID, id]
      );
    }
    user = {
      id,
      name,
      email,
      last_entered_vault_id: vaultID
    };
    const access_token = jwt.sign(user, JWT_KEY);
    user.access_token = access_token;
    await conn.query('COMMIT');
    return { user };
  } catch (error) {
    console.log(error);
    return { error };
  } finally {
    conn.release();
  }
};
const signIn = async (email, password) => {
  const conn = await pool.getConnection();
  try {
    var vault;
    await conn.query('START TRANSACTION');
    const users = await conn.query(
      'SELECT id, email, name, password, is_registered, last_entered_vault_id FROM users WHERE email = ?',
      [email]
    );
    if (users[0].length === 0) {
      await conn.query('COMMIT');
      return { error: 'Email not registered' };
    }
    const [user] = users[0];
    if (user.is_registered == 0) {
      await conn.query('COMMIT');
      return { error: 'Email not registered' };
    }
    const isSame = await comparePassword(password, user.password);
    if (!isSame) {
      await conn.query('COMMIT');
      return { error: 'Wrong Password' };
    }
    [vault] = await conn.query(
      'SELECT vault_id FROM vault_user WHERE user_id = ? LIMIT 1',
      [user.id]
    );
    if (!user.last_entered_vault_id && vault.length > 0) {
      await conn.query(
        'UPDATE users SET last_entered_vault_id = ? WHERE id = ?',
        [vault[0].vault_id, user.id]
      );
      user.last_entered_vault_id = vault[0].vault_id;
    } else if (!user.last_entered_vault_id) {
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      var [vault] = await conn.query(
        'INSERT INTO vaults (name, created_at) VALUES (?, ?)',
        ['Default', createdAt]
      );
      await conn.query(
        'INSERT INTO vault_user (vault_id, user_id) VALUES (?, ?)',
        [vault.insertId, user.id]
      );
      await conn.query(
        'UPDATE users SET last_entered_vault_id = ? WHERE id = ?',
        [vault.insertId, user.id]
      );
      user.last_entered_vault_id = vault.insertId;
    }
    user.access_token = jwt.sign(user, JWT_KEY);
    await conn.query('COMMIT');
    return { user };
  } catch (error) {
    console.log(error);
    return { error };
  } finally {
    conn.release();
  }
};
const getUserVaults = async (id) => {
  try {
    const [vaults] = await pool.query(
      `SELECT vaults.id, name, created_at 
                                  FROM vault_user join vaults 
                                  on vault_user.vault_id = vaults.id
                                  WHERE vault_user.user_id = ?`,
      [id]
    );
    return { vaults };
  } catch (error) {
    console.log(error);
    return { error };
  }
};
const deleteVault = async (userID, vaultID) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('START TRANSACTION');
    await conn.query(
      'DELETE FROM vault_user WHERE vault_id = ? and user_id = ?',
      [vaultID, userID]
    );
    await conn.query(
      'UPDATE users SET last_entered_vault_id = NULL WHERE id = ?',
      [userID]
    );

    const [users] = await conn.query(
      'SELECT user_id FROM vault_user WHERE vault_id = ?',
      [vaultID]
    );
    if (users.length < 1) {
      await conn.query(
        'DELETE files FROM files INNER JOIN folder_file ON files.file_id = folder_file.id WHERE folder_file.vault_id = ?',
        [vaultID]
      );
      await conn.query('DELETE FROM vaults WHERE id = ?', [vaultID]);
    }
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

module.exports = {
  signUp,
  signIn,
  getUserVaults,
  deleteVault
};
