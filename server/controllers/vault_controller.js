require('dotenv').config()
const validator = require('validator')
const Vault = require('../models/vault_model')

const getVault = async (req, res) => {
  if (!req.user){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const user = req.user
  const vaultID = req.params.id
  const result = await Vault.getVault(user.id, vaultID)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  const users = result.users
  if(!users){
    res.status(500).send('Database query error')
    return 
  }
  res.status(200).send({
    data: {
      users
    }
  }) 
}

const createVault = async (req, res) => {
  const userID = req.user.id
  const {name} = req.body
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  if(!name){
    res.status(400).send({error:'Wrong request'});
    return;
  }
  const result = await Vault.createVault(userID, createdAt, name)
  if(result.error){
    return res.status(500).send({error: result.error})
  }
  const id = result.id
  if(!id){
    res.status(500).send('Database query error')
    return 
  }
  res.status(200).send({
    data: {
      id
    }
  }) 
}

const addVaultUser = async (req, res) => {
  if (!req.user){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const {emails, vault_id} = req.body
  const user = req.user
  for (const email of emails){
    if (!validator.isEmail(email)) {
      res.status(400).send({error:'Invalid email format'})
      return
    }
  }
  const result = await Vault.addVaultUser(user.id, vault_id, emails)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  res.sendStatus(200)
}

const changeVaultName = async(req, res) => {
  if (!req.user){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const user = req.user
  const vaultID = req.params.id
  const {name} = req.body
  if (!name){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const result = await Vault.changeVaultName(user.id, vaultID, name)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  res.sendStatus(200)
}

module.exports =  { 
                    getVault,
                    createVault,
                    addVaultUser,
                    changeVaultName
}
