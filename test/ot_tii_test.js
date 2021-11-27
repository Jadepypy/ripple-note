const ot = require('../util/operation_transformation')
const chai = require('chai')

describe('insert insert operation transformation', () => {
  it('insert in the same position',  () => {
    const op1 = {
      position: 0,
    }
    const op2 = {
      position: 0
    }
    const transformedOps = ot.Tii(op1, op2)
    const expected = [{position: 1}, {position:0}]
    chai.expect(transformedOps).to.deep.equal(transformedOps, expected);           
  })
  it('operation1 insert after operation2',  () => {
    const op1 = {
      position: 1
    }
    const op2 = {
      position: 0
    }
    const transformedOps = ot.Tii(op1, op2)
    const expected = [{position: 2}, {position:0}]
    chai.expect(transformedOps).to.deep.equal(transformedOps, expected);           
  })
  it('operation2 insert after operation1',  () => {
    const op1 = {
      position: 0
    }
    const op2 = {
      position: 1
    }
    const transformedOps = ot.Tii(op1, op2)
    const expected = [{position: 2}, {position:0}]
    chai.expect(transformedOps).to.deep.equal(transformedOps, expected);           
  })
})