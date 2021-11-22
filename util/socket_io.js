 require('dotenv').config()
const cloneDeep = require('lodash.clonedeep')
const {
  getFile,
  getFileSystem,
  moveFile,
  changeFileName,
  removeFiles,
  restoreVersion
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
let isSaved = false
const fileArr = {}
const vaults = {}
let LogOp = {}
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
     // resetTimeInterval(socket, true)
      await trackDocVersion(id, true)
    })
    .on('changeName', async (id, name) => {
      await changeFileName(id, name)
      io.of(vaultID).emit('changeName', id, name, socket.id)
      //console.log('change name', id, name)
    })
    .on('leaveRoom', async (id) => {
      socket.leave(id)
      socket.to(socket.fileID).emit('leaveRoom', socket.id)
      //resetTimeInterval(socket, false)
      await trackDocVersion(socket.fileID, false)
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
    .on('currentSaved', () => {
      isSaved = true
      //console.log('saved')
    })
    .on('disconnect', async () => {
      io.of(vaultID).emit('leaveVault', socket.userID)
      //resetTimeInterval(socket, false)
      await trackDocVersion(socket.fileID, false)
    })
    .on('restore', async (revisionID) => {
      const fileID = socket.fileID
      fileArr[fileID].revisionID = revisionID
      const result = await restoreVersion(fileID, revisionID)
      fileArr[fileID].doc = result.doc
      fileArr[fileID].recordID = result.recordID
      isSaved = true
      LogOp[fileID] = []
      socket.to(socket.fileID).emit('restore')
      socket.emit('restore')
    })
    .on('syncDoc', (fileID, doc, revisionID) => {
      const currentDoc = fileArr[fileID].doc
      //console.log('receive')
      if(doc != currentDoc){
        //console.log('Diverge!!!',fileArr[fileID].revisionID, revisionID)
        //console.log(doc)
        //console.log('---------')
        //console.log(currentDoc)
        socket.emit('syncDoc', fileID, fileArr[fileID].revisionID, fileArr[fileID].doc)
      }
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
        if(isSaved){
          fileArr[fileID].recordID = await createOperation(fileID, revisionID, doc)
          isSaved = false
        } else{
          await updateOperation(fileID, revisionID, doc, fileArr[fileID].recordID)
        }
      }, 0)
    })
  })

}

async function trackDocVersion(fileID, hasNewUser){ 
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
      await saveDoc(fileID)
      clearInterval(onlines[fileID].intervalID)
      delete onlines[fileID]
    }
  }
}
async function saveDoc(fileID){
  let revisionID = fileArr[fileID].revisionID
  if(onlines[fileID].revisionID != revisionID){
    onlines[fileID].revisionID = revisionID
    isSaved = true
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



