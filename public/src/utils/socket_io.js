//import {STATE, OP_TYPE} from '../utils/enum.js'

class SocketIO {
  constructor() {
    this.fileID = null
    this.vaultID = null
    this.callbacks = {}
  }
  init(vaultID, token) {
    this.vaultID = vaultID
    this.socket = io(`/${vaultID}`, {auth: {token}})
    this.socket.on('fileSystem', (rootID, dataArr) => {
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
    this.socket.on('syncOp', (revisionID, syncOp) => {
      console.log('sync')
      this.trigger('syncOp', revisionID, syncOp)
    })
    this.socket.on('createFile', (id, prevID, type, socketID) => {
      if (this.socket.id != socketID){
        this.trigger('createFile', id, prevID, type)
      }
    })
    this.socket.on('moveFile', (id, targetID, socketID) => {
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
    this.socket.on('removeFiles', (id, socketID) => {
      if (this.socket.id != socketID){
        this.trigger('removeFiles', id)
      }
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
    console.log('id', this.socket.id)
    this.socket.emit('operation', revisionID, opInfo) 
  }
  changeName(id, name, type) {
    this.socket.emit('changeName', id, name, type)
  }
  moveFile(dataArr, id, targetID) {
    this.socket.emit('moveFile', dataArr, id, targetID)
  }
  createFile(id, prevID, type){
    this.socket.emit('createFile', id, prevID, type)
  }
  removeFiles(id, idArr, nodeData){
    this.socket.emit('removeFiles', id, idArr, nodeData)
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