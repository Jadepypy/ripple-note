const express = require('express')
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {cors: ['localhost:3000']});

app.use(express.static('public'))

let doc = ''

io.on("connection", (socket) => {
  socket.on('operation', (op) => {
    console.log(op)
    doc = applyOperation(doc, op)
    socket.broadcast.emit("operation", op);
  })
});

function applyOperation(doc, operation) {
  switch (operation[0]) {
    case 'insert' :
      doc = doc.substring(0, operation[1]) + operation[2] + doc.substring(operation[1], doc.length)
      break;
    case 'delete' :
      doc = doc.substring(0, operation[1] + operation[2]) + doc.substring(operation[1], doc.length)
      break;
  }
  return doc
}


httpServer.listen(8080)
app.listen(3000, () => {
  console.log('Server listening on 3000.')
})