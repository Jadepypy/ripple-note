const ot = require('../util/operation_transformation');
const chai = require('chai');

describe('delete delete operation transformation', () => {
  it('delete same context', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    };
    const transformedOps = ot.Tdd(op1, op2);
    chai.expect(transformedOps[0].type).to.equal(ot.OP_TYPE.NOOP);
    chai.expect(transformedOps[1].type).to.equal(ot.OP_TYPE.NOOP);
  });
  it('same position and op1 has larger count', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -3
    };
    const expectedOp1 = {
      type: ot.OP_TYPE.DELETE,
      position: 2,
      count: -1
    };
    const transformedOps = ot.Tdd(op1, op2);
    chai.expect(transformedOps[0]).to.deep.equal(expectedOp1);
    chai.expect(transformedOps[1].type).to.equal(ot.OP_TYPE.NOOP);
  });
  it('same position and op2 has larger count', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -3
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -4
    };
    const transformedOps = ot.Tdd(op1, op2);
    const expectedOp2 = {
      type: ot.OP_TYPE.DELETE,
      position: 2,
      count: -1
    };
    chai.expect(transformedOps[0].type).to.equal(ot.OP_TYPE.NOOP);
    chai.expect(transformedOps[1]).to.deep.equal(expectedOp2);
  });
  it('op2 deleted context falls inside op1', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 6,
      count: -4
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 4,
      count: -2
    };
    const transformedOps = ot.Tdd(op1, op2);
    const expectedOp1 = {
      type: ot.OP_TYPE.DELETE,
      position: 4,
      count: -2
    };
    chai.expect(transformedOps[0]).to.deep.equal(expectedOp1);
    chai.expect(transformedOps[1].type).to.equal(ot.OP_TYPE.NOOP);
  });
  it('op1 deleted context falls inside op2', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 4,
      count: -1
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 6,
      count: -4
    };
    const transformedOps = ot.Tdd(op1, op2);
    const expectedOp2 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -3
    };
    chai.expect(transformedOps[0].type).to.equal(ot.OP_TYPE.NOOP);
    chai.expect(transformedOps[1]).to.deep.equal(expectedOp2);
  });
  it('intersects and op1 has higher position', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 6,
      count: -4
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 4,
      count: -3
    };
    const transformedOps = ot.Tdd(op1, op2);
    const expected = [
      {
        type: ot.OP_TYPE.DELETE,
        position: 3,
        count: -2
      },
      {
        type: ot.OP_TYPE.DELETE,
        position: 2,
        count: -1
      }
    ];
    chai.expect(transformedOps).to.deep.equal(expected);
  });
  it('intersects and op2 has higher position', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -2
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 9,
      count: -5
    };
    const transformedOps = ot.Tdd(op1, op2);
    const expected = [
      {
        type: ot.OP_TYPE.DELETE,
        position: 4,
        count: -1
      },
      {
        type: ot.OP_TYPE.DELETE,
        position: 7,
        count: -4
      }
    ];
    chai.expect(transformedOps).to.deep.equal(expected);
  });
  it('mutually exclusive and op1 has higher position', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -2
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 3,
      count: -2
    };
    const transformedOps = ot.Tdd(op1, op2);
    const expected = [
      {
        type: ot.OP_TYPE.DELETE,
        position: 3,
        count: -2
      },
      {
        type: ot.OP_TYPE.DELETE,
        position: 3,
        count: -2
      }
    ];
    chai.expect(transformedOps).to.deep.equal(expected);
  });
  it('mutually exclusive and op2 has higher position', () => {
    const op1 = {
      type: ot.OP_TYPE.DELETE,
      position: 5,
      count: -2
    };
    const op2 = {
      type: ot.OP_TYPE.DELETE,
      position: 9,
      count: -4
    };
    const transformedOps = ot.Tdd(op1, op2);
    const expected = [
      {
        type: ot.OP_TYPE.DELETE,
        position: 5,
        count: -2
      },
      {
        type: ot.OP_TYPE.DELETE,
        position: 7,
        count: -4
      }
    ];
    chai.expect(transformedOps).to.deep.equal(expected);
  });
});
