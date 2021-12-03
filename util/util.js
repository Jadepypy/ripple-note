const jwt = require('jsonwebtoken');
require('dotenv').config();

const handleInternalError = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};
const wsAuthenticate = (socket, next) => {
  if (socket.handshake.auth) {
    try {
      const user = jwt.verify(socket.handshake.auth.token, process.env.JWT_KEY);
      if (!user) {
        socket.emit('error', { error: 'Wrong token' });
      }
      socket.userID = user.id;
      return next();
    } catch (error) {
      socket.emit('error', { error: 'Wrong token' });
    }
  } else {
    socket.emit('error', { error: 'Unauthorized' });
  }
  return;
};
const httpAuthenticate = (req, res, next) => {
  let bearerHeader = req.get('Authorization');
  if (!bearerHeader) {
    res.status(401).send({ error: 'Unauthorized' });
  }
  const result = bearerHeader.split('Bearer ');
  if (result.length < 2) {
    res.status(401).send({ error: 'Unauthorized' });
  }
  const token = result[1];
  try {
    const user = jwt.verify(token, process.env.JWT_KEY);
    req.user = user;
  } catch (error) {
    return res.status(403).json({ error: 'Wrong token' });
  }
  return next();
};

module.exports = { handleInternalError, httpAuthenticate, wsAuthenticate };
