const express = require('express')
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {cors: ['localhost:3000']});
let revisionID = 0
app.use(express.static('public'))

let doc = ''

io.on("connection", (socket) => {
  socket.emit('init', {id: revisionID, doc: doc})
  socket.on('operation', (op) => {
    revisionID++
    doc = applyOperation(doc, op[0])
    socket.emit('ack', revisionID)
    socket.broadcast.emit('syncOperation', {id: revisionID, op: op});
  })
});

function applyOperation(doc, operation) {
  switch (operation.opType) {
    case 'insert' :
      doc = doc.substring(0, operation.pos) + operation.key + doc.substring(operation.pos, doc.length)
      break;
    case 'delete' :
      doc = doc.substring(0, operation.pos + operation.count) + doc.substring(operation.pos, doc.length)
      break;
  }
  return doc
}

function transformation(op1, op2){
  if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.INSERT){
    if (op1.pos >= op2.pos) {
      op1.pos += 1
    } else {
      op2.pos += 1
    }
    return [op1, op2]
  } else if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.DELETE){
    if (op1.pos > op2.pos){
      op1.pos = op2.pos
    } else {

    }
  } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.INSERT){

  } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.DELETE){

  } else {

  }
}
httpServer.listen(8080)
app.listen(3000, () => {
  console.log('Server listening on 3000.')
})