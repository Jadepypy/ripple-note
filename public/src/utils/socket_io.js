//import {STATE, OP_TYPE} from '../utils/enum.js'

class SocketIO {
  constructor() {
    this.fileID = null
    this.vaultID = null
    this.socket = null
    this.isFreezed = false
    this.callbacks = {}
  }
  init(vaultID, token) {
    if(this.socket != null){
      this.socket.disconnect()
    }
    this.vaultID = vaultID
    this.socket = io(`/${vaultID}`, {auth: {token}})
    this.socket.on('fileSystem', (rootID, dataArr, revisionID, userID) => {
      this.userID = userID
      this.fsRevisionID = revisionID
      this.trigger('fileSystem',  rootID, dataArr)
    })
    this.socket.on('init', (revisionID, doc) => {
      //console.log('get data!')
      //console.log(revisionID, doc)
      this.trigger('init', revisionID, doc)
    })
    this.socket.on('ack', (revisionID) => {
      this.trigger('ack', revisionID)
    })
    this.socket.on('syncOp', (revisionID, syncOp, socketID, doc) => {
      publicDoc = doc
      if (!this.isFreezed && this.socket.id != socketID){
        this.trigger('syncOp', revisionID, syncOp)
      }
    })
    this.socket.on('createFile', (id, prevID, type, socketID, fsRevisionID) => {
      this.fsRevisionID = fsRevisionID
      if (this.socket.id != socketID){
        this.trigger('createFile', id, prevID, type)
      }
    })
    this.socket.on('moveFile', (id, targetID, socketID, fsRevisionID) => {
      this.fsRevisionID = fsRevisionID
      if (this.socket.id != socketID){
        this.trigger('moveFile', id, targetID)
      }
    })
    this.socket.on('changeName', (id, name, socketID) => {
      if (this.socket.id != socketID){
        this.trigger('changeName', id, name)
      }
    })
    // this.socket.on('joinFile', (id) => {
    //   this.trigger('joinFile', id)
    // })
    this.socket.on('leaveRoom', (id) => {
      this.trigger('leaveRoom', id)
    })
    this.socket.on('removeFiles', (id, socketID, fsRevisionID) => {
      this.fsRevisionID = fsRevisionID
      if (this.socket.id != socketID){
        this.trigger('removeFiles', id)
      }
    })
    this.socket.on('invalid', () => {
      this.trigger('invalid')
    })
    this.socket.on('leaveVault', (userID) => {
      if(userID == this.userID){
        this.trigger('leaveVault')
      }
    })
    this.socket.on('syncDoc', (revisionID, doc, syncFileID) => {
      const storage = window.sessionStorage
      const fileID = storage.getItem('file_id')
      if(!this.isFreezed && fileID == syncFileID){
        this.trigger('syncDoc', revisionID, doc)
      }
    })
    this.socket.on('restore', () => {
      location.reload()
    })
  }
  joinFile(fileID) {
    if(this.fileID !== null){
      this.leaveRoom()
    }
    //console.log('join')
    this.socket.emit('joinFile', fileID)
    this.fileID = fileID
  }
  leaveRoom() {
    this.socket.emit('leaveRoom', this.fileID)
  }
  disconnect(){
    this.socket.disconnect()
  }
  sendOperation(revisionID, opInfo) {
    this.socket.emit('operation', revisionID, opInfo, textarea.value) 
  }
  changeName(id, name, type) {
    this.socket.emit('changeName', id, name)
  }
  moveFile(dataArr, id, targetID) {
    this.socket.emit('moveFile', dataArr, id, targetID, this.fsRevisionID)
  }
  //first through api
  createFile(id, prevID, type){
    this.socket.emit('createFile', id, prevID, type, this.fsRevisionID)
  }
  removeFiles(id, idArr, nodeData){
    this.socket.emit('removeFiles', id, idArr, nodeData, this.fsRevisionID)
  }
  saveCurrent(){
    this.socket.emit('currentSaved')
  }
  restoreVersion(revisionID){
    this.socket.emit('restore', revisionID)
  }
  registerCallbacks(cb) {
    this.callbacks = {...this.callbacks, ...cb}
  }
  trigger(event, ...args) {
    if (this.callbacks[event] !== undefined){
      return this.callbacks[event](...args)
    } else {
      return () => {console.log('event not defined')}
    }
  }
}

export default SocketIO