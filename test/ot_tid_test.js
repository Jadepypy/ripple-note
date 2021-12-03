const ot = require('../util/operation_transformation');
const chai = require('chai');

describe('insert delete operation transformation', () => {
  it('insertion position among delete', () => {
    const op1 = {
      type: ot.OP_TYPE.INSERT,
      position: 4,
      key: 'a'
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    };
    const transformedOps = ot.Tid(op1, op2);
    const expectedOp1 = {
      type: ot.OP_TYPE.INSERT,
      position: 1,
      key: 'a'
    };
    const expectedOp2 = [
      {
        type: ot.OP_TYPE.DELETE,
        position: 6,
        count: -1
      },
      {
        type: ot.OP_TYPE.DELETE,
        position: 4,
        count: -3
      }
    ];

    chai
      .expect(transformedOps[0])
      .to.deep.equal(transformedOps[0], expectedOp1);
    chai
      .expect(transformedOps[1])
      .to.deep.equal(transformedOps[1], expectedOp2);
  });
  it('insertion after delete', () => {
    const op1 = {
      type: ot.OP_TYPE.INSERT,
      position: 5,
      key: 'a'
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    };
    const transformedOps = ot.Tid(op1, op2);
    const expected = [
      {
        type: ot.OP_TYPE.INSERT,
        position: 1,
        key: 'a'
      },
      {
        type: ot.OP_TYPE.DELETE,
        position: 5,
        count: -4
      }
    ];
    chai.expect(transformedOps).to.deep.equal(transformedOps, expected);
  });
  it('insertion before delete', () => {
    const op1 = {
      type: ot.OP_TYPE.INSERT,
      position: 1,
      key: 'a'
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    };
    const transformedOps = ot.Tid(op1, op2);
    const expected = [
      {
        type: ot.OP_TYPE.INSERT,
        position: 1,
        key: 'a'
      },
      {
        type: ot.OP_TYPE.DELETE,
        position: 6,
        count: -4
      }
    ];
    chai.expect(transformedOps).to.deep.equal(transformedOps, expected);
  });
});
