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

function dblClickEvt(obj) {
  let pos = obj.selectionStart;
  let text = obj.value;
  let lineStart = text.lastIndexOf("\n", pos);
  if (lineStart > 0){
    obj.selectionStart = lineStart
  }
}

textarea.addEventListener('keydown', function (event) {
  let key = event.key == 'Enter'? '\n' : event.key
  const indexStart = textarea.selectionStart
  const indexEnd = textarea.selectionEnd
  if (specialKeys.includes(key)) return
  let opInfo = []
  if (key == 'Backspace'){
    opInfo.push({opType: OP_TYPE.DELETE, pos: indexEnd, count: Math.min(indexStart - indexEnd, -1)})
    console.log('opinfo:', opInfo)
  } else {
    //console.log("INSERT:", OP_TYPE.INSERT, indexStart, key)
    if (indexEnd - indexStart > 0){
      opInfo.push({opType: OP_TYPE.DELETE, pos: indexEnd, count: indexStart - indexEnd})
    }
    opInfo.push({opType: OP_TYPE.INSERT, pos: indexStart, key: key})
  }
  //////////////
  if (state === STATE.CLEAR){
    outstandingOp.push(...opInfo)
    //console.log('OUTSTANDING:', outstandingOp)
    socket.emit('operation', {revisionID, operation: outstandingOp}) 
    state = STATE.WAITING
  } else {
    bufferOp.push(...opInfo)
  }
});

socket.on('init', (init) => {
  //console.log(init)
  revisionID = init.id
  textarea.value = init.doc
})

socket.on('ack', (id) => {
  //console.log('acknowledment')
  revisionID = id
  state = STATE.CLEAR
  outstandingOp = []
  if (bufferOp.length > 0){
    //console.log('send operatoin')
    //console.log(bufferOp)
    socket.emit('operation', {revisionID, operation: bufferOp})
    outstandingOp = [...bufferOp]
    state = STATE.WAITING
    bufferOp = []
  }
})

socket.on('syncOperation', (syncInfo) => {
  revisionID = syncInfo.id
  console.log('GET SYNC:')
  for (const op of syncInfo.syncOp){
    console.log(op)
  }
  if (outstandingOp.length > 0){
    //change syncOp inplace
    //console.log(outstandingOp)
    iterateOT([...outstandingOp], syncInfo.syncOp)
  }
  if (bufferOp.length > 0){
    //change syncOp inplace
    //console.log('buffer not empty')
    bufferOp = iterateOT(bufferOp, syncInfo.syncOp)
  }
  console.log('APPLY OP:', syncInfo)
  textarea.value = applyOperation(textarea.value, syncInfo.syncOp)
})

function applyOperation(doc, operation) {
  for (const op of operation){
    switch (op.opType) {
    case OP_TYPE.INSERT :
      doc = doc.substring(0, op.pos) + op.key + doc.substring(op.pos, doc.length)
      break;
    case OP_TYPE.DELETE :
      doc = doc.substring(0, op.pos + op.count) + doc.substring(op.pos, doc.length)
      break;
    }
  }
  return doc
}
//Time Complexity: O(N*M), seems inevitable
function iterateOT (opArr1, opArr2) {
  console.log("BEFORE:")
  for (const op of opArr2){
    console.log(op)
  }
  let opArr1Prime = []
  //let opArr2Prime = [...opArr2]
  for (let op1 of opArr1){
    for (let i =0; i < opArr2.length; i++){
      let op2
      [op1, op2] = transformation(op1, opArr2[i])
      if (Array.isArray(op2)){
        opArr2[i++] = op2[0]
        opArr2.splice(i, 0, op2[1])
      } else{
        opArr2[i] = op2    
      }
    }
    if (Array.isArray(op1)){
      opArr1Prime.push(op1[0])
      opArr1Prime.push(op1[1]) 
    } else{
      opArr1Prime.push(op1)
    }
  }
  console.log("TRANSFORM OP:", opArr2)
  return opArr1Prime
}



//heart of OT
function transformation(op1, op2){
  if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.INSERT){
    return Tii(op1, op2)
  } else if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.DELETE){
    return Tid(op1, op2)
  } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.INSERT){
    const result = Tid(op2, op1)
    return [result[1], result[0]]
  } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.DELETE){
    return Tdd(op1, op2)
  }
  return [op1, op2]
}

//insert  insert transformation
function Tii(op1, op2){
  if (op1.pos > op2.pos) {
    op1.pos += 1
  } else {
    op2.pos += 1
  }
  return [op1, op2]
}
//insert delete transformation
function Tid(op1, op2){
  const op1Temp = {...op1}
  console.log('Tid:', op1, op2)
  if (op1.pos > op2.pos + op2.count){
    op1.pos = Math.max(op2.pos + op2.count, op1Temp.pos + op2.count)
    if (op1Temp.pos < op2.pos) {
      const op2First = {...op2}
      op2First.pos += 1
      op2First.count = (op1Temp.pos + 1) - op2First.pos
      const op2Second = {opType: OP_TYPE.DELETE, pos: op1Temp.pos, count: op2.count - op2First.count} 
      op2 = [op2First, op2Second]
    }
  } else {
    op2.pos += 1
  }
  return [op1, op2]
}
//delete delete transformation
function Tdd(op1, op2){
  if (op1.pos == op2.pos){
    if (op1.count == op2.count){
      op1.opType = OP_TYPE.NOOP
      op2.opType = OP_TYPE.NOOP
    } else if (Math.abs(op1.count) > Math.abs(op2.count)){
      op1.pos = op2.pos + op2.count
      op1.count = op1.count - op2.count
      op2.opType = OP_TYPE.NOOP     
    } else {
      op2.pos = op1.pos + op1.count
      op2.count = op2.count - op1.count
      op1.opType = OP_TYPE.NOOP
    }
  } else if (op1.pos + op1.count < op2.pos && op1.pos > op2.pos) {
    const op2Temp = {...op2}
    if (op2.pos + op2.count >= op1.pos + op1.count){
      op2.opType = OP_TYPE.NOOP
      op1.pos = op1.pos + op2Temp.count
      op1.count = op1.count - op2Temp.count 
    } else {
      op2.pos = op1.pos + op1.count
      op2.count = (op2Temp.pos + op2Temp.count) - (op1.pos + op1.count)
      op1.count = op2Temp.pos - op1.pos
      op1.pos = op1.pos + op2Temp.count
    }
  } else if (op2.pos + op2.count < op1.pos && op2.pos > op1.pos) {
    const op1Temp = {...op1}
    if (op1.pos + op1.count >= op2.pos + op2.count){
      op1.opType = OP_TYPE.NOOP
      op2.pos = op2.pos + op1Temp.count
      op2.count = op2.count - op1Temp.count 
    } else {
      op1.pos = op2.pos + op2.count
      op1.count = (op1Temp.pos + op1Temp.count) - (op2.pos + op2.count)
      op2.count = op1Temp.pos - op2.pos
      op2.pos = op2.pos + op1Temp.count
    }
  } else if (op1.pos > op2.pos) {
    op1.pos = op1.pos + op2.count
  } else {
    op2.pos = op2.pos + op1.count
  }
  //console.log('delete delete----')
  //console.log(op1, op2)
  return [op1, op2]
}
