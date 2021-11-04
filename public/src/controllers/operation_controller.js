import BaseController from "./base_controller.js"
//import {Node} from '../utils/utils.js'

class OperationController extends BaseController{
  constructor (operation, fileSystem, socketIO, api){
    super(operation, fileSystem, socketIO, api)

  }
  init() {
    const callbacks = {
      init: this.initializeNote.bind(this),
      ack: this.handleAcknowledgement.bind(this),
      syncOp: this.handleSyncOperation.bind(this) 
    }
    this.socketIO.registerCallbacks(callbacks)
    //addEventListers: an unorthodox approach (for simplification)
    this.addTrashIconListener()
    this.addTextAreaListener()
  }
  initializeNote(revisionID, doc) {
    console.log('init??')
    this.operation.revisionID = revisionID
    this.operation.doc = doc
    console.log('???')
    renderEditor(doc, this.operation.name)
  }

  handleAcknowledgement(revisionID) {
    this.operation.revisionID = revisionID
    this.operation.state = STATE.CLEAR
    let bufferOp = this.operation.bufferOp
    let outstandingOp = []
    if (bufferOp.length > 0){
      this.socketIO.sendOperation(revisionID, bufferOp)
      outstandingOp = [...bufferOp]
      this.operation.state = STATE.WAITING
      bufferOp = []
    }
    this.operation.bufferOp = bufferOp
    this.operation.outstandingOp = outstandingOp
  }
  handleSyncOperation(revisionID, syncOp) {
    this.operation.revisionID = revisionID
    let outstandingOp = this.operation.outstandingOp
    let bufferOp = this.operation.bufferOp
    if (outstandingOp.length > 0){
      this.operation.iterateOT([...outstandingOp], syncOp)
    }
    if (bufferOp.length > 0){
      bufferOp = this.operation.iterateOT(bufferOp, syncOp)
    }
    this.operation.bufferOp = bufferOp
    this.operation.outstandingOp = outstandingOp
    this.applyOperation(syncOp)
  }
  applyOperation(operation){
    console.log('APPLY OP:', operation)
    let doc = textarea.value
    for (const op of operation){
      switch (op.type) {
        case OP_TYPE.INSERT :
          doc = doc.substring(0, op.position) + op.key + doc.substring(op.position, doc.length)
          break;
        case OP_TYPE.DELETE :
          doc = doc.substring(0, op.position + op.count) + doc.substring(op.position, doc.length)
          break;
      }
      renderEditor(doc)
    }
  }
  addTrashIconListener(){
    trash.addEventListener('click', (event) => {
      showEditor(false)
      this.changeSelectedFile(null)
    })
  }

  addTextAreaListener() {
    textarea.addEventListener('keydown',(event) => {
      let key = event.key == 'Enter'? '\n' : event.key
      const indexStart = textarea.selectionStart
      const indexEnd = textarea.selectionEnd
      if (SPECIAL_KEYS.includes(key)) return
      let opInfo = []
      if (key == 'Backspace'){
        opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: Math.min(indexStart - indexEnd, -1)})
        console.log('opinfo:', opInfo)
      } else {
        if (indexEnd - indexStart > 0){
          opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: indexStart - indexEnd})
        }
        opInfo.push({type: OP_TYPE.INSERT, position: indexStart, key: key})
      }
      this.handleTextAreaOperation(opInfo)
    })
  }
  handleTextAreaOperation(opInfo){
    let state = this.operation.state
    const outstandingOp = this.operation.outstandingOp
    const bufferOp = this.operation.bufferOp
    const revisionID = this.operation.revisionID
    if (state === STATE.CLEAR){
      outstandingOp.push(...opInfo)
      this.socketIO.sendOperation(revisionID, outstandingOp)
      this.operation.state = STATE.WAITING
    } else {
      bufferOp.push(...opInfo)
    }
  }
}

export default OperationController