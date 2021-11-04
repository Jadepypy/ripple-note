//import {STATE, OP_TYPE} from '../utils/enum.js'

class SocketIO {
  constructor() {
    this.roomID = null
    this.vaultID = null
  }
  init(vaultID, token) {
    this.vaultID = vaultID
    this.socket = io(`/${vaultID}`, {auth: {token}})
    this.socket.on('fileSystem', (rootID, dataArr) => {
      this.trigger('fileSystem',  rootID, dataArr)
    })
    this.socket.on('init', (revisionID, doc) => {
      this.trigger('init', revisionID, doc)
    })
    this.socket.on('ack', (revisionID) => {
      // console.log('ack??')
      this.trigger('ack', revisionID)
    })
    this.socket.on('syncOp', (revisionID, syncOp) => {
      this.trigger('syncOp', revisionID, syncOp)
    })
  }
  joinFile(roomID) {
    if(this.roomID !== null){
      this.leaveRoom()
    }
    this.socket.emit('joinRoom', roomID)
    this.roomID = roomID
  }
  leaveRoom() {
    this.socket.emit('leaveRoom', this.roomID)
  }
  sendOperation(revisionID, opInfo) {
    // console.log('op')
    console.log(opInfo)
    this.socket.emit('operation', revisionID, opInfo) 
  }
  changeName(id, name, type) {
    this.socket.emit('changeName', id, name, type)
  }

  registerCallbacks(cb) {
    this.callbacks = cb
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