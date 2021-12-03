require('dotenv').config();
const validator = require('validator');
const User = require('../models/user_model');

const signIn = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(403).send({ error: 'Email, and password are required' });
  }
  const result = await User.signIn(email, password);
  if (result.error) {
    return res.status(403).send({ error: result.error });
  }
  const user = result.user;
  if (!user) {
    res.status(500).send('Database query error');
    return;
  }
  res.status(200).send({
    data: {
      access_token: user.access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        last_entered_vault_id: user.last_entered_vault_id
      }
    }
  });
};

const signUp = async (req, res) => {
  const { email, password } = req.body;
  let { name } = req.body;

  if (!name || !email || !password) {
    res.status(400).send({ error: 'Name, email, and password are required' });
    return;
  }
  if (!validator.isEmail(email)) {
    res.status(400).send({ error: 'Invalid email format' });
    return;
  }
  name = validator.escape(name);
  const result = await User.signUp(name, email, password);
  if (result.error) {
    return res.status(403).send({ error: result.error });
  }
  const user = result.user;
  if (!user) {
    res.status(500).send('Database query error');
    return;
  }
  res.status(200).send({
    data: {
      access_token: user.access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        last_entered_vault_id: user.last_entered_vault_id
      }
    }
  });
};
const getUserProfile = async (req, res) => {
  if (!req.user) {
    res.status(400).send({ error: 'Wrong Request' });
    return;
  }
  const user = req.user;
  res.status(200).send({
    data: {
      name: user.name,
      email: user.email
    }
  });
};
const getUserVaults = async (req, res) => {
  if (!req.user) {
    res.status(400).send({ error: 'Wrong Request' });
    return;
  }
  const user = req.user;
  const result = await User.getUserVaults(user.id);
  if (result.error) {
    return res.status(403).send({ error: result.error });
  }
  const vaults = result.vaults;
  if (!vaults) {
    res.status(500).send('Database query error');
    return;
  }
  res.status(200).send({
    data: {
      vaults
    }
  });
};

const deleteVault = async (req, res) => {
  if (!req.user) {
    res.status(400).send({ error: 'Wrong Request' });
    return;
  }
  const user = req.user;
  const vaultID = req.params.id;
  const result = await User.deleteVault(user.id, vaultID);
  if (result.error) {
    return res.status(500).send({ error: result.error });
  }
  res.sendStatus(200);
};

module.exports = {
  getUserVaults,
  deleteVault,
  getUserProfile,
  signIn,
  signUp
};
