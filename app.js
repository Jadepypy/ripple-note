const express = require('express')
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {cors: ['localhost:3000']});

let revisionID = 0
const LogOp = []

app.use('/node_modules', express.static('node_modules'));
app.use(express.static('public'))

io.of(/^\/[0-9]+$/)
  .use((socket, next) => {
    console.log(socket.handshake.auth)
    if(socket.handshake.auth) {
      socket.userID = 1
      return next()
    }
  })
  .on('connection', (socket) => {
    console.log('userID', socket.userID)
    const dataArr = [[0, 1, null, -1], [1, 2, null, -1], [2, 3, null, -1], [3, 4, null, -1], [4, 5, null, -1], [5, 6, null, -1], [6, 7, null, -1], [7, 8, null, -1], [8, 9, null, -1], [9, 10, null, -1], [10, 11, null, -1], [11, null, null, -1]]
    socket.emit('fileSystem', 0, dataArr)

  })

httpServer.listen(3000, function(){
  console.log('listening on *:3000');
});
// const OP_TYPE = {
//   INSERT: 0,
//   DELETE: 1,
//   NOOP: -1
// }

// let doc = ''

// io.on("connection", (socket) => {
//   socket.emit('init', {id: revisionID, doc: doc})
//   socket.on('operation', (info) => {
//     setTimeout(() => {
//       console.log("SERVER INFO:", info)
//       if (revisionID > info.revisionID) {
//         for (let i = info.revisionID + 1; i < LogOp.length; i++){
//           if (LogOp[i]){
//             //change info.operation inplace
//             iterateOT(LogOp[i], info.operation)
//           } 
//         }
//       }
//       revisionID++
//       doc = applyOperation(doc, info.operation)
//       //console.log('pending...')
//       socket.emit('ack', revisionID)
//       socket.broadcast.emit('syncOperation', {id: revisionID, syncOp: info.operation});
//       console.log('SEND SYNC:', info.operation)
//       LogOp[revisionID] = info.operation
//     }, 4000)
//   })
// });

// //Time Complexity: O(N*M), seems inevitable
// function iterateOT (opArr1, opArr2) {
//   let opArr1Prime = []
//   //let opArr2Prime = [...opArr2]
//   for (let op1 of opArr1){
//     for (let i =0; i < opArr2.length; i++){
//       let op2
//       [op1, op2] = transformation(op1, opArr2[i])
//       if (Array.isArray(op2)){
//         opArr2[i++] = op2[0]
//         opArr2.splice(i, 0, op2[1])
//       } else{
//         opArr2[i] = op2    
//       }
//     }
//     if (Array.isArray(op1)){
//       opArr1Prime.push(op1[0])
//       opArr1Prime.push(op1[1]) 
//     } else{
//       opArr1Prime.push(op1)
//     }
//   }
//   return opArr1Prime
// }

// function applyOperation(doc, operation) {
//   for (const op of operation){
//     switch (op.opType) {
//       case OP_TYPE.INSERT :
//         doc = doc.substring(0, op.pos) + op.key + doc.substring(op.pos, doc.length)
//         break;
//       case OP_TYPE.DELETE :
//         doc = doc.substring(0, op.pos + op.count) + doc.substring(op.pos, doc.length)
//         break;
//     }
//   }
//   return doc
// }



// //heart of OT
// function transformation(op1, op2){
//   if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.INSERT){
//     return Tii(op1, op2)
//   } else if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.DELETE){
//     return Tid(op1, op2)
//   } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.INSERT){
//     const result = Tid(op2, op1)
//     return [result[1], result[0]]
//   } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.DELETE){
//     return Tdd(op1, op2)
//   }
//   return [op1, op2]
// }

// //insert  insert transformation
// function Tii(op1, op2){
//   if (op1.pos >= op2.pos) {
//     op1.pos += 1
//   } else {
//     op2.pos += 1
//   }
//   return [op1, op2]
// }
// //insert delete transformation
// function Tid(op1, op2){
//   const op1Temp = {...op1}
//   if (op1.pos > op2.pos + op2.count){
//     op1.pos = Math.max(op2.pos + op2.count, op1Temp.pos + op2.count)
//     if (op1Temp.pos < op2.pos) {
//       const op2First = {...op2}
//       op2First.pos += 1
//       op2First.count = (op1Temp.pos + 1) - op2First.pos
//       const op2Second = {opType: OP_TYPE.DELETE, pos: op1Temp.pos, count: op2.count - op2First.count} 
//       op2 = [op2First, op2Second]
//     }
//   } else {
//     op2.pos += 1
//   }
//   return [op1, op2]
// }
// //delete delete transformation
// function Tdd(op1, op2){
//   if (op1.pos == op2.pos){
//     if (op1.count == op2.count){
//       op1.opType = OP_TYPE.NOOP
//       op2.opType = OP_TYPE.NOOP
//     } else if (Math.abs(op1.count) > Math.abs(op2.count)){
//       op1.pos = op2.pos + op2.count
//       op1.count = op1.count - op2.count
//       op2.opType = OP_TYPE.NOOP     
//     } else {
//       op2.pos = op1.pos + op1.count
//       op2.count = op2.count - op1.count
//       op1.opType = OP_TYPE.NOOP
//     }
//   } else if (op1.pos + op1.count < op2.pos && op1.pos > op2.pos) {
//     const op2Temp = {...op2}
//     if (op2.pos + op2.count >= op1.pos + op1.count){
//       op2.opType = OP_TYPE.NOOP
//       op1.pos = op1.pos + op2Temp.count
//       op1.count = op1.count - op2Temp.count 
//     } else {
//       op2.pos = op1.pos + op1.count
//       op2.count = (op2Temp.pos + op2Temp.count) - (op1.pos + op1.count)
//       op1.count = op2Temp.pos - op1.pos
//       op1.pos = op1.pos + op2Temp.count
//     }
//   } else if (op2.pos + op2.count < op1.pos && op2.pos > op1.pos) {
//     const op1Temp = {...op1}
//     if (op1.pos + op1.count >= op2.pos + op2.count){
//       op1.opType = OP_TYPE.NOOP
//       op2.pos = op2.pos + op1Temp.count
//       op2.count = op2.count - op1Temp.count 
//     } else {
//       op1.pos = op2.pos + op2.count
//       op1.count = (op1Temp.pos + op1Temp.count) - (op2.pos + op2.count)
//       op2.count = op1Temp.pos - op2.pos
//       op2.pos = op2.pos + op1Temp.count
//     }
//   } else if (op1.pos > op2.pos) {
//     op1.pos = op1.pos + op2.count
//   } else {
//     op2.pos = op2.pos + op1.count
//   }
//   //console.log('delete delete----')
//   //console.log(op1, op2)
//   return [op1, op2]
// }

// httpServer.listen(8080)
// app.listen(3000, () => {
//   console.log('Server listening on 3000.')
// })