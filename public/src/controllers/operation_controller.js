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
    this.inputOn = true
    this.keydownOn = true
    this.compositionOn = false
    this.lastStart = 0
    this.lastEnd = 0
    this.socketIO.registerCallbacks(callbacks)
    //addEventListers: an unorthodox approach (for simplification)
    this.addTrashIconListener()
    this.addTextAreaListener()
  }
  initializeNote(revisionID, doc) {
    this.operation.revisionID = revisionID
    this.operation.doc = doc
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
    //console.log('outstanding', outstandingOp)
    //console.log('bufferOp', bufferOp)
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
    let currentStart = textarea.selectionStart
    let currentEnd = textarea.selectionEnd
    for (const op of operation){
      switch (op.type) {
        case OP_TYPE.INSERT :
          if(op.position < currentStart){
            currentStart++
          }
          if(op.position < currentEnd){
            currentEnd++
          }
          let prevPart = doc.substring(0, op.position)
          if(prevPart == ''){
            prevPart = ' '.repeat(Math.max(op.position, 0))
          }
          doc = prevPart + op.key + doc.substring(op.position, doc.length)
          break;
        case OP_TYPE.DELETE :
          if(op.position + op.count <= currentStart){
            currentStart = op.position + op.count
          }
          if(op.position + op.count <= currentEnd){
            currentEnd = op.position + op.count
          }
          doc = doc.substring(0, op.position + op.count) + doc.substring(op.position, doc.length)
          break;
      }
    }
    renderEditor(doc, undefined, currentStart, currentEnd)
  }
  addTrashIconListener(){
    trash.addEventListener('click', (event) => {
      showEditor(false)
      this.changeSelectedFile(null)
    })
  }

  addTextAreaListener() {
    textarea.addEventListener('paste', (event) => {
      const indexStart = textarea.selectionStart
      const indexEnd = textarea.selectionEnd
      let opInfo = []
      console.log('paste triggered')
      this.inputOn = false
      let paste = (event.clipboardData || window.clipboardData).getData('text')
      //console.log(paste.length, textarea.selectionEnd)
      if(indexEnd - indexStart > 0){
          opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: indexStart - indexEnd})
      }
      let position = indexStart
      for (let i = 0; i < paste.length; i++){
        opInfo.push({type: OP_TYPE.INSERT, position: position++, key: paste[i]})
      }
      this.handleTextAreaOperation(opInfo)
    })
    textarea.addEventListener('cut', () => {
      console.log('cut triggered')
      this.inputOn = false
      let opInfo = []
      const indexStart = textarea.selectionStart
      const indexEnd = textarea.selectionEnd
      if(indexEnd - indexStart > 0){
        opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: indexStart - indexEnd})
      }
      this.handleTextAreaOperation(opInfo)
    })
    textarea.addEventListener('compositionstart', () => {
      console.log('compositionstart triggered')
      this.inputOn = false
      this.keydownOn = false
      this.lastStart = textarea.selectionStart
      this.lastEnd = textarea.selectionEnd
    }) 
    textarea.addEventListener('compositionupdate', () => {
      console.log('compositionupdate triggered')
      this.keydownOn = false
      this.inputOn = false
    }) 
    textarea.addEventListener('compositionend', (event) => {
      console.log('compositionend triggered')
      let opInfo = []
      if(this.lastEnd - this.lastStart > 0){
        opInfo.push({type: OP_TYPE.DELETE, position: this.lastEnd, count: this.lastStart - this.lastEnd})
      }
      let position = this.lastStart
      const character = event.data
      for (let i = 0; i < character.length; i++){
        opInfo.push({type: OP_TYPE.INSERT, position: position++, key: character[i]})
      }
      this.keydownOn = true
      this.handleTextAreaOperation(opInfo)
    }) 
    textarea.addEventListener('keydown', (event) => {
      if(!this.keydownOn){
        return
      }
      console.log('white space triggered')
      const indexStart = textarea.selectionStart
      const indexEnd = textarea.selectionEnd
      //if (SPECIAL_KEYS.includes(key)) return
      let opInfo = []
      if (event.key == 'Backspace'){
        opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: Math.min(indexStart - indexEnd, -1)})
      }
      this.lastStart = indexStart
      this.lastEnd = indexEnd
      if( event.key == 'Enter'){
        if(indexEnd > indexStart){
          opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: indexStart - indexEnd})
        }
        opInfo.push({type: OP_TYPE.INSERT, position: indexStart, key: '\n'})
      }
      if(opInfo.length > 0){
        this.handleTextAreaOperation(opInfo)
      }
    })
    textarea.addEventListener('input', (event) => {
      if(!this.inputOn){
        this.inputOn = true
        return
      }
      if(event.data !== null){
        let opInfo = []
        //const indexEnd = textarea.selectionEnd
        console.log('input triggered')
        if(this.lastEnd - this.lastStart > 0){
          opInfo.push({type: OP_TYPE.DELETE, position: this.lastEnd, count: this.lastStart - this.lastEnd})
        }
        opInfo.push({type: OP_TYPE.INSERT, position: this.lastStart, key: event.data})
        this.handleTextAreaOperation(opInfo)
      }
    })
    // textarea.addEventListener('keydown',(event) => {
    //   let key = event.key == 'Enter'? '\n' : event.key
    //   const indexStart = textarea.selectionStart
    //   const indexEnd = textarea.selectionEnd
    //   if (SPECIAL_KEYS.includes(key)) return
    //   let opInfo = []
    //   if (key == 'Backspace'){
    //     opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: Math.min(indexStart - indexEnd, -1)})
    //     console.log('opinfo:', opInfo)
    //   } else {
    //     if (indexEnd - indexStart > 0){
    //       opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: indexStart - indexEnd})
    //     }
    //     opInfo.push({type: OP_TYPE.INSERT, position: indexStart, key: key})
    //   }
    //   this.handleTextAreaOperation(opInfo)
    // })
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