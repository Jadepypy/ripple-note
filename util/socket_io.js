 require('dotenv').config()
const cloneDeep = require('lodash.clonedeep')
const {
  getFile,
  getFileSystem,
  moveFile,
  changeFileName,
  removeFiles
} = require('../server/controllers/file_sytem_controller')
const {
  createOperation,
  updateOperation
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
const onlines = {}//fileID: {count, intervalID}
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
      if(!fileArr[id]){
        const result = await getFile(id)
        if(result.error){
          socket.emit('error', result.error)
        }
        const {revisionID, doc, recordID} = result
        fileArr[id] = {
          revisionID,
          doc,
          recordID
        }
      }
      socket.emit('init', fileArr[id].revisionID, fileArr[id].doc) 
      socket.to(socket.fileID).emit('joinFile', socket.id)
      resetTimeInterval(socket, true)
      trackDocVersion(id, true)
    })
    .on('changeName', async (id, name) => {
      await changeFileName(id, name)
      io.of(vaultID).emit('changeName', id, name, socket.id)
      //console.log('change name', id, name)
    })
    .on('leaveRoom', (id) => {
      socket.leave(id)
      socket.to(socket.fileID).emit('leaveRoom', socket.id)
      resetTimeInterval(socket)
      trackDocVersion(socket.fileID, false)
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
      resetTimeInterval(socket, false)
      trackDocVersion(socket.fileID, false)
    })
    .on('operation', (clientRevisionID, operation, text) => {
      // console.log(clientRevisionID, operation)
      setTimeout(async () => {
        const userID = socket.userID
        const fileID = socket.fileID
        if(LogOp[fileID] == undefined){
          LogOp[fileID] = []
        }
        if (fileArr[fileID].revisionID > clientRevisionID) {
          for (let i = clientRevisionID + 1; i < LogOp[fileID].length; i++){
            if (LogOp[fileID][i]){
              //change info.operation inplace
              iterateOT(cloneDeep(LogOp[fileID][i]), operation)
            } 
          }
        }
        fileArr[fileID].revisionID++
        fileArr[fileID].doc = applyOperation(fileArr[fileID].doc, operation)
        let revisionID = fileArr[fileID].revisionID
        let doc = fileArr[fileID].doc
        socket.emit('ack', revisionID)
        //console.log('Sync OP', revisionID, operation)
        socket.to(socket.fileID).emit('syncOp', revisionID, operation, socket.id, doc);
        LogOp[fileID][revisionID] = operation
        await updateOperation(fileID, revisionID, doc, fileArr[fileID].recordID)
        // console.log('create Operation', fileID, revisionID, fileArr[fileID].doc)
        // if(backUpOp.length > 0){
        //   await createOperation(fileID, revisionID, doc, backUpOp)
        // }
      }, 0)
    })
  })

}

function trackDocVersion(fileID, hasNewUser){ 
  if(hasNewUser){
    if(onlines[fileID]){
      onlines[fileID].count++
    } else{
      onlines[fileID] = {}
      onlines[fileID].revisionID = fileArr[fileID].revisionID
      onlines[fileID].count = 1
      onlines[fileID].intervalID = setInterval(() => {
        saveDoc(fileID)
      }, 30000)
    }
    return
  } 
  if(onlines[fileID]){
    if(onlines[fileID].count > 1){
      onlines[fileID].count--
    } else{
      saveDoc(fileID)
      clearInterval(onlines[fileID].intervalID)
      delete onlines[fileID]
    }
  }
}
async function saveDoc(fileID){
  let doc = fileArr[fileID].doc
  let revisionID = fileArr[fileID].revisionID
  console.log('enter save doc')
  if(onlines[fileID].revisionID != revisionID){
    console.log('save', fileID, 'revisionID', revisionID)
    await createOperation(fileID, revisionID, doc)
    onlines[fileID].revisionID = revisionID
  }
}
function resetTimeInterval(socket, hasNewRoom){
  const fileID = socket.fileID
  const intervalID = socket.intervalID
  if(intervalID){
    clearInterval(intervalID)
  }
  if(hasNewRoom){
    socket.intervalID = setInterval(() => {
      socket.emit('syncDoc', fileArr[fileID].revisionID, fileArr[fileID].doc, fileID)
    }, 5000)
  }
}

function printOpInfo(opInfo){
  for(const op of opInfo){
    if(op.type == OP_TYPE.INSERT){
      console.log('INSERT', 'pos', op.position, 'key', op.key)
    } else{
      console.log('DELETE', 'pos', op.position, 'count', op
      .count, 'key', op.key)
    }
  }
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



