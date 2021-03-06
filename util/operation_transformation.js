const OP_TYPE = {
  INSERT: 0,
  DELETE: 1,
  RETAIN: 2,
  NOOP: -1
};

const printOT = (opInfo) => {
  if (Array.isArray(opInfo)) {
    if (opInfo.type == OP_TYPE.INSERT) {
      console.log('INSERT', 'pos', opInfo[0].position, 'key', opInfo[0].key);
    } else {
      console.log(
        'DELETE',
        'pos',
        opInfo[0].position,
        'count',
        opInfo[0].count
      );
    }
    if (opInfo.type == OP_TYPE.INSERT) {
      console.log('INSERT', 'pos', opInfo[1].position, 'key', opInfo[1].key);
    } else {
      console.log(
        'DELETE',
        'pos',
        opInfo[1].position,
        'count',
        opInfo[1].count
      );
    }
  } else {
    if (opInfo.type == OP_TYPE.INSERT) {
      console.log('INSERT', 'pos', opInfo.position, 'key', opInfo.key);
    } else {
      console.log('DELETE', 'pos', opInfo.position, 'count', opInfo.count);
    }
  }
};
//Time Complexity: O(N*M), seems inevitable
const iterateOT = (opArr1, opArr2) => {
  let opArr1Prime = [];
  for (let op1Oringial of opArr1) {
    let op1Current = [op1Oringial];
    let op1Next = [];
    for (let i = 0; i < opArr2.length; i++) {
      op1Next = [];
      for (let op1 of op1Current) {
        let op2;
        const result = transformation(op1, opArr2[i]);
        op1 = result[0];
        op2 = result[1];
        if (Array.isArray(op2)) {
          opArr2[i++] = op2[0];
          opArr2.splice(i, 0, op2[1]);
        } else {
          opArr2[i] = op2;
        }
        if (Array.isArray(op1)) {
          op1Next = [...op1Next, ...op1];
        } else {
          op1Next.push(op1);
        }
      }
      op1Current = [...op1Next];
    }
    opArr1Prime = [...opArr1Prime, ...op1Next];
  }
  return opArr1Prime;
};

const applyOperation = (doc, operation) => {
  for (const op of operation) {
    switch (op.type) {
      case OP_TYPE.INSERT:
        let prevPart = doc.substring(0, op.position);
        if (prevPart == '') {
          prevPart = ' '.repeat(Math.max(op.position, 0));
        }
        doc = prevPart + op.key + doc.substring(op.position, doc.length);
        break;
      case OP_TYPE.DELETE:
        doc =
          doc.substring(0, op.position + op.count) +
          doc.substring(op.position, doc.length);
        break;
    }
  }
  return doc;
};

//heart of OT
const transformation = (op1, op2) => {
  if (op1.type == OP_TYPE.INSERT && op2.type == OP_TYPE.INSERT) {
    return Tii(op1, op2);
  } else if (op1.type == OP_TYPE.INSERT && op2.type == OP_TYPE.DELETE) {
    return Tid(op1, op2);
  } else if (op1.type == OP_TYPE.DELETE && op2.type == OP_TYPE.INSERT) {
    const result = Tid(op2, op1);
    return [result[1], result[0]];
  } else if (op1.type == OP_TYPE.DELETE && op2.type == OP_TYPE.DELETE) {
    return Tdd(op1, op2);
  }
  return [op1, op2];
};
//insert  insert transformation
function Tii(op1, op2) {
  if (op1.position >= op2.position) {
    op1.position += 1;
  } else {
    op2.position += 1;
  }
  return [op1, op2];
}
//insert delete transformation
function Tid(op1, op2) {
  const op1Temp = { ...op1 };
  if (op1.position > op2.position + op2.count) {
    op1.position = Math.max(
      op2.position + op2.count,
      op1Temp.position + op2.count
    );
    if (op1Temp.position < op2.position) {
      const op2First = { ...op2 };
      op2First.position += 1;
      op2First.count = op1Temp.position + 1 - op2First.position;
      const op2Second = {
        type: OP_TYPE.DELETE,
        position: op1Temp.position,
        count: op2.count - op2First.count
      };
      op2 = [op2First, op2Second];
    }
  } else {
    op2.position += 1;
  }
  return [op1, op2];
}
//delete delete transformation
function Tdd(op1, op2) {
  if (op1.position == op2.position) {
    if (op1.count == op2.count) {
      op1.type = OP_TYPE.NOOP;
      op2.type = OP_TYPE.NOOP;
    } else if (Math.abs(op1.count) > Math.abs(op2.count)) {
      op1.position = op2.position + op2.count;
      op1.count = op1.count - op2.count;
      op2.type = OP_TYPE.NOOP;
    } else {
      op2.position = op1.position + op1.count;
      op2.count = op2.count - op1.count;
      op1.type = OP_TYPE.NOOP;
    }
  } else if (
    op1.position + op1.count < op2.position &&
    op1.position > op2.position
  ) {
    const op2Temp = { ...op2 };
    if (op2.position + op2.count >= op1.position + op1.count) {
      op2.type = OP_TYPE.NOOP;
      op1.position = op1.position + op2Temp.count;
      op1.count = op1.count - op2Temp.count;
    } else {
      op2.position = op1.position + op1.count;
      op2.count = op2Temp.position + op2Temp.count - (op1.position + op1.count);
      op1.count = op2Temp.position - op1.position;
      op1.position = op1.position + op2Temp.count;
    }
  } else if (
    op2.position + op2.count < op1.position &&
    op2.position > op1.position
  ) {
    const op1Temp = { ...op1 };
    if (op1.position + op1.count >= op2.position + op2.count) {
      op1.type = OP_TYPE.NOOP;
      op2.position = op2.position + op1Temp.count;
      op2.count = op2.count - op1Temp.count;
    } else {
      op1.position = op2.position + op2.count;
      op1.count = op1Temp.position + op1Temp.count - (op2.position + op2.count);
      op2.count = op1Temp.position - op2.position;
      op2.position = op2.position + op1Temp.count;
    }
  } else if (op1.position > op2.position) {
    op1.position = op1.position + op2.count;
  } else {
    op2.position = op2.position + op1.count;
  }
  return [op1, op2];
}

module.exports = {
  iterateOT,
  Tii,
  Tid,
  Tdd,
  applyOperation,
  OP_TYPE
};
