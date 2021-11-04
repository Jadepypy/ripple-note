require('dotenv').config();
const express = require('express')
const app = express()

app.use('/node_modules', express.static('node_modules'))
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

// app.use('/', mainRoutes)
// app.use('/product', productRoutes)
// app.use('/campaign', campaignRoutes)

app.use('/api', 
        [
          require('./server/routes/user_route'),
          require('./server/routes/file_route')
        ]
)

app.get('/hello', (req, res) => {
  res.send('<h1>Hello</h1>')
})

app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
})




/////////////////////////
const Operation = require('./server/models/operation')
const FileSystem = require('./server/models/file_system')
const FileSystemController = require('./server/controllers/file_sytem_controller')

////
let revisionID = 0
const LogOp = []
const OP_TYPE = {
  INSERT: 0,
  DELETE: 1,
  NOOP: -1
}

const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {cors: ['localhost:3000']});
//sokcet
const files = {}
io.of(/^\/[0-9]+$/)
  .use((socket, next) => {
    console.log(socket.handshake.auth)
    if(socket.handshake.auth) {
      socket.userID = 1
      return next()
    }
  })
  .on('connection', async (socket) => {
    // console.log('userID', socket.userID)
    // const dataArr = [[0, 1, null, -1, 'vault'], [1, 4, 2, 0, 'Folder1'], [2, 5, 3, 0, 'Folder2'], [3, 10, null, 0, 'Folder3'], [4, null, 8, 1, 'File4'],  [8, null, 9, 1, 'File8'], [9, null, null, 1, 'File9'], [5, null, 6, 1, 'File5'], [6, null, null, 1, 'File6'], [10, 11, null, 0, 'Folder10'], [11, null, null, 1, 'File11']]
    const vaultID = socket.nsp.name.replace('/', '')
    
   const result = await FileSystemController.getFileSystem(vaultID)
    console.log(result)
    socket.emit('fileSystem', result[0], result[1])
    socket.on('joinRoom', async (id) => {
      socket.join(id)
      socket.fileID = id
      if(files[id] === undefined){
        const result = FileSystem.getFile(id)
        if(result.length > 0){
          console.log('result', result)
          files[id] = {revisionID: result[0], doc: result[1]}
        } else{
          files[id] = {revisionID: 0, doc: ''}

        }
      } 
      // const [fileSystem] = FileSystem.getFileSystem(vaultID)
      socket.emit('init', files[id].revisionID, files[id].doc) 
         
      console.log(`user ${socket.userID} joined room ${id}`)
    })
    socket.on('changeName', async (id, name, type) => {
      if(type == FileSystem.DATA_TYPE.VAULT){

      } else{
        await FileSystemController.changeFileName(id, name)
        socket.to(socket.fileID).emit('changeName', id, name)
      }
    })
    socket.on('leaveRoom', (id) => {
      socket.leave(id)
      console.log(`user ${socket.userID} left room ${id}`)
    })
    socket.on('operation', (clientRevisionID, operation) => {
      const userID = socket.userID
      //const vaultID = socket.nsp.name.replace('/', '')
      const fileID = socket.fileID
      const time = new Date().toISOString().slice(0, 19).replace('T', ' ')
      let revisionID = files[fileID].revisionID
      let doc = files[fileID].doc
      console.log(files, files[fileID], files[fileID].doc)
      console.log('doc', doc)


      // console.log(clientRevisionID, operation)
      setTimeout(async () => {
        // console.log("ID", clientRevisionID, "SERVER INFO:", operation)
        if (revisionID > clientRevisionID) {
          for (let i = clientRevisionID + 1; i < LogOp.length; i++){
            if (LogOp[i]){
              //change info.operation inplace
              iterateOT(LogOp[i], operation)
            } 
          }
        }
        revisionID++
        doc = applyOperation(doc, operation)
        //console.log('pending...')
        socket.emit('ack', revisionID)
        // socket.broadcast.emit('syncOperation', revisionID, info.operation);
        // console.log(socket.fileID)
        socket.to(socket.fileID).emit('syncOp', revisionID, operation);
        // console.log('SEND SYNC:', operation)
        LogOp[revisionID] = operation
        console.log(operation)
        const backUpOp = operation.map((op) => {
          return [  revisionID,  
                    userID,
                    fileID,
                    op.type,
                    op.position,
                    op.count != undefined? op.count: 0,
                    op.key != undefined? op.key: '',
                    time
                  ]
        })
        await Operation.createOperation(fileID, revisionID, doc, backUpOp)
        files[fileID].doc = doc
        files[fileID].revisionID = revisionID
      }, 0)
    })

    
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

//Time Complexity: O(N*M), seems inevitable
function iterateOT (opArr1, opArr2) {
  let opArr1Prime = []
  //let opArr2Prime = [...opArr2]
  for (let op1 of opArr1){
    for (let i =0; i < opArr2.length; i++){
      let op2
      [op1, op2] = transformation(op1, opArr2[i])
      if (Array.isArray(op2)){
        opArr2[i++] = op2[0]
        opArr2.splice(i, 0, op2[1])
      } else{
        opArr2[i] = op2    
      }
    }
    if (Array.isArray(op1)){
      opArr1Prime.push(op1[0])
      opArr1Prime.push(op1[1]) 
    } else{
      opArr1Prime.push(op1)
    }
  }
  return opArr1Prime
}

function applyOperation(doc, operation) {
  for (const op of operation){
    switch (op.type) {
      case OP_TYPE.INSERT :
        doc = doc.substring(0, op.position) + op.key + doc.substring(op.position, doc.length)
        break;
      case OP_TYPE.DELETE :
        doc = doc.substring(0, op.position + op.count) + doc.substring(op.position, doc.length)
        break;
    }
  }
  return doc
}



//heart of OT
function transformation(op1, op2){
  if (op1.type == OP_TYPE.INSERT && op2.type == OP_TYPE.INSERT){
    return Tii(op1, op2)
  } else if (op1.type == OP_TYPE.INSERT && op2.type == OP_TYPE.DELETE){
    return Tid(op1, op2)
  } else if (op1.type == OP_TYPE.DELETE && op2.type == OP_TYPE.INSERT){
    const result = Tid(op2, op1)
    return [result[1], result[0]]
  } else if (op1.type == OP_TYPE.DELETE && op2.type == OP_TYPE.DELETE){
    return Tdd(op1, op2)
  }
  return [op1, op2]
}

//insert  insert transformation
function Tii(op1, op2){
  if (op1.position >= op2.position) {
    op1.position += 1
  } else {
    op2.position += 1
  }
  return [op1, op2]
}
//insert delete transformation
function Tid(op1, op2){
  const op1Temp = {...op1}
  if (op1.position > op2.position + op2.count){
    op1.position = Math.max(op2.position + op2.count, op1Temp.position + op2.count)
    if (op1Temp.position < op2.position) {
      const op2First = {...op2}
      op2First.position += 1
      op2First.count = (op1Temp.position + 1) - op2First.position
      const op2Second = {type: OP_TYPE.DELETE, pos: op1Temp.position, count: op2.count - op2First.count} 
      op2 = [op2First, op2Second]
    }
  } else {
    op2.position += 1
  }
  return [op1, op2]
}
//delete delete transformation
function Tdd(op1, op2){
  if (op1.position == op2.position){
    if (op1.count == op2.count){
      op1.type = OP_TYPE.NOOP
      op2.type = OP_TYPE.NOOP
    } else if (Math.abs(op1.count) > Math.abs(op2.count)){
      op1.position = op2.position + op2.count
      op1.count = op1.count - op2.count
      op2.type = OP_TYPE.NOOP     
    } else {
      op2.position = op1.position + op1.count
      op2.count = op2.count - op1.count
      op1.type = OP_TYPE.NOOP
    }
  } else if (op1.position + op1.count < op2.position && op1.position > op2.position) {
    const op2Temp = {...op2}
    if (op2.position + op2.count >= op1.position + op1.count){
      op2.type = OP_TYPE.NOOP
      op1.position = op1.position + op2Temp.count
      op1.count = op1.count - op2Temp.count 
    } else {
      op2.position = op1.position + op1.count
      op2.count = (op2Temp.position + op2Temp.count) - (op1.position + op1.count)
      op1.count = op2Temp.position - op1.position
      op1.position = op1.position + op2Temp.count
    }
  } else if (op2.position + op2.count < op1.position && op2.position > op1.position) {
    const op1Temp = {...op1}
    if (op1.position + op1.count >= op2.position + op2.count){
      op1.type = OP_TYPE.NOOP
      op2.position = op2.position + op1Temp.count
      op2.count = op2.count - op1Temp.count 
    } else {
      op1.position = op2.position + op2.count
      op1.count = (op1Temp.position + op1Temp.count) - (op2.position + op2.count)
      op2.count = op1Temp.position - op2.position
      op2.position = op2.position + op1Temp.count
    }
  } else if (op1.position > op2.position) {
    op1.position = op1.position + op2.count
  } else {
    op2.position = op2.position + op1.count
  }
  //console.log('delete delete----')
  //console.log(op1, op2)
  return [op1, op2]
}

// httpServer.listen(8080)
// app.listen(3000, () => {
//   console.log('Server listening on 3000.')
// })