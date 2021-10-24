const textarea = document.querySelector('textarea')
const specialKeys = ['Alt', 'Shift', 'Meta', 'Control', 'CapsLock', 'Tab', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']
const socket = io('http://localhost:8080')
let outstandingOp = []
let bufferOp = []
let revisionID
const STATE = {
  CLEAR: 0,
  WAITING: -1  
}
const OP_TYPE = {
  INSERT: 0,
  DELETE: 1,
  NOOP: -1
}
let state = STATE.CLEAR

textarea.addEventListener('keydown', function (event) {
  let key = event.key == 'Enter'? '\n' : event.key
  const indexStart = textarea.selectionStart;
  const indexEnd = textarea.selectionEnd;
  if (specialKeys.includes(key)) return
  let opInfo
  if (key == 'Backspace'){
    opInfo = {opType: OP_TYPE.DELETE, pos: indexEnd, count: Math.min(indexStart - indexEnd, -1)}
  } else {
    opInfo = {opType: OP_TYPE.INSERT, pos: indexStart, key: key}
  }
  if (state == STATE.CLEAR){
    outstandingOp.push(opInfo)
    socket.emit('operation', outstandingOp) 
    state = STATE.WAITING
  } else {
    bufferOp.push(opInfo)
  }
});

socket.on('init', (init) => {
  console.log(init)
  revisionID = init.id
  textarea.value = init.doc
})

socket.on('ack', (id) => {
  console.log('acknowledment')
  console.log(id)
  revisionID = id
  state = STATE.CLEAR
  if (bufferOp.length > 0){
    socket.emit('operation', bufferOp) 
    state = STATE.WAITING
    pendingOp = []
  }
})

socket.on('syncOperation', (syncOp) => {
  revisionID = syncOp.id

  textarea.value = applyOperation(textarea.value, syncOp.op[0])
})

function applyOperation(doc, operation) {
  switch (operation.opType) {
    case OP_TYPE.INSERT :
      doc = doc.substring(0, operation.pos) + operation.key + doc.substring(operation.pos, doc.length)
      break;
    case OP_TYPE.DELETE :
      doc = doc.substring(0, operation.pos + operation.count) + doc.substring(operation.pos, doc.length)
      break;
  }
  return doc
}

function iterateOperation () {

}

function transformation(op1, op2){
  if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.INSERT){
    if (op1.pos > op2.pos) {
      op1.pos += 1
    } else {
      op2.pos += 1
    }
    return [op1, op2]
  } else if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.DELETE){
    if (op1.pos > op2.pos){
      op1.pos = op2.pos
    } else {

    }
  } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.INSERT){

  } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.DELETE){

  } else {

  }
}

