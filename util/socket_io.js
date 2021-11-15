 
require('dotenv').config()
const {
  getFile,
  getFileSystem,
  moveFile,
  changeFileName,
  removeFiles
} = require('../server/controllers/file_sytem_controller')
const {
  createOperation
} = require('../server/controllers/operation_controller')
const {
  iterateOT,
  applyOperation,
  OP_TYPE
} = require('./operation_transformation')
const {
  DATA_TYPE
} = require('../server/models/file_system')
const {
  wsAuthenticate
} = require('./util')
const fileArr = {}
const vaults = {}
const LogOp = {}
// const dataArr = [[0, 1, null, -1, 'vault'], [1, 4, 2, 0, 'Folder1'], [2, 5, 3, 0, 'Folder2'], [3, 10, null, 0, 'Folder3'], [4, null, 8, 1, 'File4'],  [8, null, 9, 1, 'File8'], [9, null, null, 1, 'File9'], [5, null, 6, 1, 'File5'], [6, null, null, 1, 'File6'], [10, 11, null, 0, 'Folder10'], [11, null, null, 1, 'File11']]
const start = (io) => {
io.of(/^\/[0-9]+$/)
  .use(wsAuthenticate)
  .on('connection', async (socket) => {
    const vaultID = socket.nsp.name.replace('/', '')
    //console.log(`user connected on ${vaultID}`)
    const result = await getFileSystem(vaultID)
    socket.emit('fileSystem', result[0], result[1], result[2], socket.userID)
    vaults[vaultID] = result[2]

    socket.on('joinFile', async (id) => {
      socket.join(id)
      socket.fileID = id
     const result = await getFile(id)
     if(result.error){
       socket.emit('error', result.error)
     }
     const {revisionID, doc} = result
      fileArr[id] = {
        revisionID,
        doc
      }
      socket.emit('init', revisionID, doc) 
      //console.log(`user ${socket.userID} joined room ${id}`)
      //console.log(`send revisionID  ${fileArr[id].revisionID} text ${fileArr[id].doc}`)
      socket.to(socket.fileID).emit('joinFile', socket.id)
    })
    .on('changeName', async (id, name) => {
      await changeFileName(id, name)
      io.of(vaultID).emit('changeName', id, name, socket.id)
      //console.log('change name', id, name)
    })
    .on('leaveRoom', (id) => {
      socket.leave(id)
      socket.to(socket.fileID).emit('leaveRoom', socket.id)
      //console.log(`user ${socket.userID} left room ${id}`)
    })
    .on('moveFile', async (dataArr, id, targetID, revisionID) => {
      if(revisionID < vaults[vaultID]){
        socket.emit('invalid', id, socket.id)
        return
      }
      vaults[vaultID]++
      const result = await moveFile(dataArr, vaultID, vaults[vaultID])
      if(result.error){
        socket.emit('invalid', id, socket.id)
        vaults[vaultID]--
        return
      }
      io.of(vaultID).emit('moveFile', id, targetID, socket.id, vaults[vaultID])
      //console.log('move file')
    })
    .on('createFile', (id, prevID, type, revisionID) => {
      vaults[vaultID] = ++revisionID
      io.of(vaultID).emit('createFile', id, prevID, type, socket.id, vaults[vaultID])
    })
    .on('removeFiles', async (id, idArr, data, revisionID) => {
      if(revisionID < vaults[vaultID]){
        socket.emit('invalid', id, socket.id)
        return
      }
      vaults[vaultID]++
      const result = await removeFiles(idArr, data, vaultID, vaults[vaultID])
      if(result.error){
        socket.emit('invalid', id, socket.id)
        vaults[vaultID]--
        return
      }
      io.of(vaultID).emit('removeFiles', id, socket.id, vaults[vaultID])
    })
    .on('disconnect', () => {
      io.of(vaultID).emit('leaveVault', socket.userID)
    })
    .on('operation', (clientRevisionID, operation, text) => {
      // console.log(clientRevisionID, operation)
      setTimeout(async () => {
        const userID = socket.userID
        //const vaultID = socket.nsp.name.replace('/', '')
        const fileID = socket.fileID
        //console.log('received', operation)
        if(LogOp[fileID] == undefined){
          LogOp[fileID] = []
        }
        const time = new Date().toISOString().slice(0, 19).replace('T', ' ')
        let revisionID = fileArr[fileID].revisionID
        let doc = fileArr[fileID].doc
        //console.log('files', fileArr[fileID], fileArr[fileID].doc)
        //console.log('inittial doc', doc)
        // console.log("ID", clientRevisionID, "SERVER INFO:", operation)
        if (revisionID > clientRevisionID) {
          for (let i = clientRevisionID + 1; i < LogOp[fileID].length; i++){
            if (LogOp[fileID][i]){
              //change info.operation inplace
              iterateOT(LogOp[fileID][i], operation)
            } 
          }
        }
        revisionID++
        doc = applyOperation(doc, operation)
        //console.log('pending...')
        // if(text != doc ){
        //   console.log('DIVERGE================')
        //   console.log('client', clientRevisionID)
        //   console.log('revisionID', revisionID)
        //   console.log(doc)
        //   console.log('------------')
        //   console.log(text)
        // }
        socket.emit('ack', revisionID)
        //console.log('Sync OP', revisionID, operation)
        socket.to(socket.fileID).emit('syncOp', revisionID, operation, socket.id, doc);
        LogOp[fileID][revisionID] = operation
        //console.log(operation)
        // const backUpOp = operation.map((op) => {
        //     return [  revisionID,  
        //               userID,
        //               fileID,
        //               op.type,
        //               op.position,
        //               op.count != undefined? op.count: 0,
        //               op.key != undefined? op.key: '',
        //               time
        //             ]
          
        // })
        const backUpOp = operation.reduce((result, op) => {
          if(op.type != OP_TYPE.RETAIN){
            result.push([  revisionID,  
                          userID,
                          fileID,
                          op.type,
                          op.position,
                          op.count != undefined? op.count: 0,
                          op.key != undefined? op.key: '',
                          time
                        ])
          }
          //console.log(op.type)
          return result
        }, [])
        //console.log('create Operation', fileID, revisionID, operatin, doc)
        if(backUpOp.length > 0){
          await createOperation(fileID, revisionID, doc, backUpOp)
        }
        fileArr[fileID].doc = doc
        fileArr[fileID].revisionID = revisionID
      }, 3000)
    })
  })

}

module.exports = {start}
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



