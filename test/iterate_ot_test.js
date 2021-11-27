const serverOT = require('../util/operation_transformation')
const OperationModel = require('../public/src/models/operation_model')
const chai = require('chai')

let doc
const clientOT = new OperationModel()
describe('iterate through operations', () => {
  it('insert and delete',  () => {
    const opArr1 = [{
      type: ot.OP_TYPE.INSERT,
      position: 4,
      key: 'a'
    }]
    const opArr2 = [{
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    }]
    const opArr1Prime = ot.iterateOT(opArr1, opArr2)
    const expectedOpArr1 = [{
                        type: ot.OP_TYPE.INSERT,
                        position: 1,
                        key: 'a'
                      }]
    const expectedOpArr2 = [{
                       type: ot.OP_TYPE.DELETE,
                        position: 6,
                        count: -1
                      }, 
                      {
                        type: ot.OP_TYPE.DELETE,
                        position: 4,
                        count: -3
                      }]
    chai.expect(opArr1Prime).to.deep.equal(opArr1Prime, expectedOpArr1)
    chai.expect(opArr2).to.deep.equal(opArr2, expectedOpArr2)          
  })
  it('insert and delete',  () => {
    const opArr1 = [{
      type: ot.OP_TYPE.INSERT,
      position: 4,
      key: 'a'
    }]
    const opArr2 = [{
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    }]
    const opArr1Prime = ot.iterateOT(opArr1, opArr2)
    const expectedOpArr1 = [{
                        type: ot.OP_TYPE.INSERT,
                        position: 1,
                        key: 'a'
                      }]
    const expectedOpArr2 = [{
                       type: ot.OP_TYPE.DELETE,
                        position: 6,
                        count: -1
                      }, 
                      {
                        type: ot.OP_TYPE.DELETE,
                        position: 4,
                        count: -3
                      }]
    chai.expect(opArr1Prime).to.deep.equal(opArr1Prime, expectedOpArr1)
    chai.expect(opArr2).to.deep.equal(opArr2, expectedOpArr2)          
  })
})

function generateOperation(type, opNum){
  const operations = []
  let docLength = doc.length
  for(let i = 0; i < opNum; i++){
    type = Math.floor(Math.random()*2)
    let position
    if(type == OP_TYPE.DELETE){
      if(doc.length <= 0){
        continue
      }
      position = Math.floor(Math.random()*docLength + 1)
      const count = (-1)*Math.min(Math.floor(Math.random()*(position+1)), 10)
      operations.push({ type: OP_TYPE.DELETE,
                        position,
                        count
                      })
      docLength += count 
    } else{
      const key = characters[Math.floor(Math.random() * characters.length)]
      position = Math.floor(Math.random()*(docLength+1))
      operations.push({ type: OP_TYPE.INSERT,
                        position,
                        key
                      })
      docLength++
    }
  }
  return operations
}