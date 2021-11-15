require('dotenv').config()
const validator = require('validator')
const User = require('../models/user')


const signIn = async(req, res) => {
  const {provider, email, password} = req.body
  let result
  switch(provider) {
    case 'native':
      result = await nativeSignIn(email, password)
      break
    default:
      result = {error: 'Wrong request'}
  }
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  const user = result.user
  if(!user){
    res.status(500).send('Database query error')
    return 
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
  })
}

const nativeSignIn = async (email, password) => {
  if(!email || !password){
    return {error:'Email, and password are required'} 
  }
  try{
    return await User.nativeSignIn(email, password)
  } catch(error) {
    return {error}
  }
}

const signUp = async (req, res) => {
  const {email, password} = req.body
  let {name} = req.body

  if(!name || !email || !password){
    res.status(400).send({error:'Name, email, and password are required'})
    return    
  }
  if (!validator.isEmail(email)) {
    res.status(400).send({error:'Invalid email format'})
    return
  }
  name = validator.escape(name)
  const result = await User.signUp(name, email, password)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  const user = result.user
  if(!user){
    res.status(500).send('Database query error')
    return 
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
  })
}
const getUserProfile = async (req, res) => {
  if (!req.user){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const user = req.user
  res.status(200).send({
    data : {
      name: user.name,
      email: user.email
    }
  })
}
const getVaults = async (req, res) => {
  if (!req.user){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const user = req.user
  //console.log(user)
  const result = await User.getVaults(user.id)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  const vaults = result.vaults
  if(!vaults){
    res.status(500).send('Database query error')
    return 
  }
  res.status(200).send({
    data: {
      vaults
    }
  }) 
}
const getVault = async (req, res) => {
  if (!req.user){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const user = req.user
  const vaultID = req.params.id
  const result = await User.getVault(user.id, vaultID)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  const users = result.users
  res.status(200).send({
    data: {
      users
    }
  }) 
}
const deleteVault = async (req, res) => {
  if (!req.user){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const user = req.user
  const vaultID = req.params.id
  const result = await User.deleteVault(user.id, vaultID)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  res.sendStatus(200) 
}
const createVault = async (req, res) => {
  const userID = req.user.id
  const {name} = req.body
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  if(!name){
    res.status(400).send({error:'Wrong request'});
    return;
  }
  const result = await User.createVault(userID, createdAt, name)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  const id = result.id
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
  //console.log(vault_id)
  const user = req.user
  for (const email of emails){
    if (!validator.isEmail(email)) {
      res.status(400).send({error:'Invalid email format'})
      return
    }
  }
  const result = await User.addVaultUser(user.id, vault_id, emails)
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
  const result = await User.changeVaultName(user.id, vaultID, name)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  res.sendStatus(200)
}

module.exports =  { 
                    getVaults,
                    getVault,
                    deleteVault,
                    createVault,
                    addVaultUser,
                    changeVaultName,
                    getUserProfile,
                    signIn,
                    signUp,
}
