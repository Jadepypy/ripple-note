import {STATE, OP_TYPE} from '../utils/enum.js'
class OperationModel {
  constructor () {
    this.outstandingOp = []
    this.bufferOp = []
    this.state = STATE.CLEAR
    this.id = null
    this.name = null
    this.revisionID = null
    this.doc = null
  }

  iterateOT (opArr1, opArr2) {
    console.log("BEFORE:")
    for (const op of opArr2){
      console.log(op)
    }
    let opArr1Prime = []
    //let opArr2Prime = [...opArr2]
    for (let op1 of opArr1){
      for (let i =0; i < opArr2.length; i++){
        let op2
        [op1, op2] = this.transformation(op1, opArr2[i])
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
  transformation(op1, op2){
    if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.INSERT){
      return this.Tii(op1, op2)
    } else if (op1.opType == OP_TYPE.INSERT && op2.opType == OP_TYPE.DELETE){
      return this.Tid(op1, op2)
    } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.INSERT){
      const result = this.Tid(op2, op1)
      return [result[1], result[0]]
    } else if (op1.opType == OP_TYPE.DELETE && op2.opType == OP_TYPE.DELETE){
      return this.Tdd(op1, op2)
    }
    return [op1, op2]
  }

  //insert  insert transformation
  Tii(op1, op2){
    if (op1.pos > op2.pos) {
      op1.pos += 1
    } else {
      op2.pos += 1
    }
    return [op1, op2]
  }
  //insert delete transformation
  Tid(op1, op2){
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
  Tdd(op1, op2){
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
}

export default OperationModel