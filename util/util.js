const jwt = require('jsonwebtoken')
const {CONNECTION_TYPE} = require('../server/models/user')
require('dotenv').config();

const handleInternalError = (fn) => {
  return function(req, res, next) {
    fn(req, res, next).catch(next)
  }
}
const httpAuthenticate = (req, res, next) => {
  let bearerHeader = req.get('Authorization')
  if(!bearerHeader) {
    res.status(401).send({ error: 'Unauthorized'})
  }
  const result = bearerHeader.split('Bearer ')
  if (result.length < 2){
    res.status(401).send({ error: 'Unauthorized'})
  } 
  const token = result[1]   
  try {
    const user = jwt.verify(token, process.env.JWT_KEY)
    req.user = user
  } catch (error) {
    return res.status(403).json({ error: 'Wrong token' })
  }
  return next()
}
const wsAuthenticate = (socket, next) => {
  const vaultID = socket.nsp.name.replace('/', '')
  if(vaultID == process.env.DEMO_VAULT_ID){
    socket.userID = process.env.VISITOR_USER_ID
    return next()
  }
  if(socket.handshake.auth) {
    try{
      const user = jwt.verify(socket.handshake.auth.token, process.env.JWT_KEY)
      if(!user){
        socket.emit('error', {error: 'Wrong token'})
      }
      socket.userID = user.id
    } catch (error) {
      socket.emit('error', {error: 'Wrong token'})
    }
    return next()
  } else{
    socket.emit('error', {error: 'Wrong token'})
  }
  return
}

module.exports = {  handleInternalError,           
                    httpAuthenticate, 
                    wsAuthenticate
                  }