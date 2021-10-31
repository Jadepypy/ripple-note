
class SocketIO {
  init(vaultID, token) {
    this.socket = io(`/${vaultID}`, {auth: {token}})
    this.socket.on('fileSystem', (rootID, dataArr) => {   
                  this.trigger('fileSystem', rootID, dataArr)           
                })
  }
  registerCallbacks(cb) {
    this.callbacks = cb
  }
  trigger(event, ...args) {
    if (this.callbacks[event] !== undefined){
      this.callbacks[event](...args)
    } else {
      return () => {console.log('event not defined')}
    }
  }
}

export default SocketIO