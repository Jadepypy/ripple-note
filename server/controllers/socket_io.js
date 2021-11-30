require('dotenv').config()
const cloneDeep = require('lodash.clonedeep')
const {
  getFile,
  getFileSystem,
  moveFile,
  changeFileName,
  removeFiles,
  restoreFileVersion,
  updateFileVersion,
  createFileVersion
} = require('./file_sytem_controller')
const {
  iterateOT,
  applyOperation,
  OP_TYPE
} = require('../../util/operation_transformation')
const {
  wsAuthenticate
} = require('../../util/util')

const fileArr = {}
const vaultRevision = {}
let LogOp = {}
const onlines = {}

const start = (io) => {
io.of(/^\/[0-9]+$/)
  .use(wsAuthenticate)
  .on('connection', async (socket) => {
    const vaultID = socket.nsp.name.replace('/', '')
    const {firstChild, files, revisionID} = await getFileSystem(vaultID, socket.userID)
    socket.emit('fileSystem', firstChild, files, revisionID, socket.userID)
    vaultRevision[vaultID] = revisionID

    socket.on('joinFile', async (id) => {
      socket.join(id)
      socket.fileID = id
      let lastSaved = false
      if(!fileArr[id]){
        const result = await getFile(id)
        if(result.error){
          socket.emit('error', result.error)
        }
        const {revisionID, doc, recordID, revisionName} = result
        fileArr[id] = {
          revisionID,
          doc,
          recordID
        }
        lastSaved = !(revisionName == null)
      }
      socket.emit('init', fileArr[id].revisionID, fileArr[id].doc) 
      socket.to(socket.fileID).emit('joinFile', socket.id)
      await trackDocVersion(id, true, lastSaved)
    })
    .on('changeName', async (id, name) => {
      await changeFileName(id, name)
      io.of(vaultID).emit('changeName', id, name, socket.id)
    })
    .on('leaveRoom', async (id) => {
      socket.leave(id)
      socket.to(socket.fileID).emit('leaveRoom', socket.id)
      await trackDocVersion(socket.fileID, false)
    })
    .on('moveFile', async (dataArr, id, targetID, revisionID) => {
      if(revisionID < vaultRevision[vaultID]){
        socket.emit('invalid', id, socket.id)
        return
      }
      vaultRevision[vaultID]++
      const result = await moveFile(dataArr, vaultID, vaultRevision[vaultID])
      if(result.error){
        socket.emit('invalid', id, socket.id)
        vaultRevision[vaultID]--
        return
      }
      io.of(vaultID).emit('moveFile', id, targetID, socket.id, vaultRevision[vaultID])
    })
    .on('createFile', (id, prevID, type, revisionID) => {
      vaultRevision[vaultID] = ++revisionID
      io.of(vaultID).emit('createFile', id, prevID, type, socket.id, vaultRevision[vaultID])
    })
    .on('removeFiles', async (id, idArr, data, revisionID) => {
      if(revisionID < vaultRevision[vaultID]){
        socket.emit('invalid', id, socket.id)
        return
      }
      vaultRevision[vaultID]++
      const result = await removeFiles(idArr, data, vaultID, vaultRevision[vaultID])
      if(result.error){
        socket.emit('invalid', id, socket.id)
        vaultRevision[vaultID]--
        return
      }
      io.of(vaultID).emit('removeFiles', id, socket.id, vaultRevision[vaultID])
    })
    .on('currentSaved', () => {
      onlines[socket.fileID].isSaved = true
    })
    .on('disconnect', async () => {
      io.of(vaultID).emit('leaveVault', socket.userID)
      await trackDocVersion(socket.fileID, false)
    })
    .on('restore', async (revisionID) => {
      const fileID = socket.fileID
      fileArr[fileID].revisionID = revisionID
      const result = await restoreFileVersion(fileID, revisionID)
      fileArr[fileID].doc = result.doc
      fileArr[fileID].recordID = result.recordID
      onlines[fileID].isSaved = true
      LogOp[fileID] = []
      socket.to(socket.fileID).emit('restore')
      socket.emit('restore')
    })
    .on('syncDoc', (fileID, doc, revisionID) => {
      if(!fileArr[fileID]){
        return
      }
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
    .on('operation', (clientRevisionID, operation) => {
      console.log(clientRevisionID, operation)
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
        if(onlines[fileID].isSaved && onlines[fileID].revisionID != revisionID){
          fileArr[fileID].recordID = await createFileVersion(fileID, revisionID, doc)
          onlines[fileID].isSaved = false
        } else{
          await updateFileVersion(fileID, revisionID, doc, fileArr[fileID].recordID)
        }
      }, 0)
    })
  })

}

async function trackDocVersion(fileID, hasNewUser, lastSaved){ 
  if(hasNewUser){
    if(onlines[fileID]){
      onlines[fileID].count++
    } else{
      onlines[fileID] = {
        revisionID: fileArr[fileID].revisionID,
        count: 1,
        isSaved: lastSaved,
        intervalID: setInterval(() => {
          saveDoc(fileID)
        }, 30000)
      }
    }
    return
  } 
  if(onlines[fileID]){
    if(onlines[fileID].count > 1){
      onlines[fileID].count--
    } else{
      //await saveDoc(fileID)
      clearInterval(onlines[fileID].intervalID)
      delete onlines[fileID]
      delete fileArr[fileID]
    }
  }
}
async function saveDoc(fileID){
  let revisionID = fileArr[fileID].revisionID
  if(onlines[fileID].revisionID != revisionID){
    onlines[fileID].revisionID = revisionID
    onlines[fileID].isSaved = true
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



