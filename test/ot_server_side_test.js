const app = require('../app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const io = require('socket.io-client');
const { OP_TYPE } = require('../util/operation_transformation');
const { createFakeData, deleteFakeData } = require('./test_data_generator');
const NODE_ENV = process.env.NODE_ENV;
const { users, vault, file } = require('./fake_data');
const sinon = require('sinon');
const fileSystem = require('../server/models/file_system_model');
chai.use(chaiHttp);
const requester = chai.request(app).keepOpen();
const socketURL = `http://localhost:3000`;
let joinFileCount = 0;
let successCallCount = 0;
describe('send operation to server via socket io', function () {
  this.timeout(5000);
  const clients = { 1: {}, 2: {}, 3: {} };
  let op1, op2, op3;
  let stub1, stub2;
  before(() => {
    return new Promise(async (resolve) => {
      if (NODE_ENV !== 'test') {
        console.log('Not in test env');
        return;
      }
      await deleteFakeData();
      clients[1].accessToken = await signUp(users[0]);
      await createFakeData();
      await addVaultUser(clients[1].accessToken, [
        users[1].email,
        users[2].email
      ]);
      clients[2].accessToken = await signUp(users[1]);
      clients[3].accessToken = await signUp(users[2]);
      clients[1].socket = establishConnection(clients[1].accessToken);
      clients[2].socket = establishConnection(clients[2].accessToken);
      clients[3].socket = establishConnection(clients[3].accessToken);
      op1 = [
        {
          type: OP_TYPE.INSERT,
          position: 4,
          key: 'a'
        },
        {
          type: OP_TYPE.DELETE,
          position: 6,
          count: -1
        }
      ];
      op2 = [
        {
          type: OP_TYPE.INSERT,
          position: 4,
          key: 'a'
        },
        {
          type: OP_TYPE.DELETE,
          position: 6,
          count: -1
        }
      ];
      op3 = [
        {
          type: OP_TYPE.INSERT,
          position: 4,
          key: 'a'
        },
        {
          type: OP_TYPE.DELETE,
          position: 6,
          count: -1
        }
      ];
      stub1 = sinon.stub(fileSystem, 'createFileVersion').callsFake(() => {});
      stub2 = sinon.stub(fileSystem, 'updateFileVersion').callsFake(() => {});
      setTimeout(() => {
        if (joinFileCount === 3) {
          resolve();
        }
      }, 3000);
    });
  });
  beforeEach(() => {
    return new Promise((resolve) => {
      joinFileCount = 0;
      for (const id in clients) {
        clients[id].revisionID = 0;
        clients[id].callCount = 0;
        clients[id].socket.emit('leaveRoom', file.id);
        clients[id].socket.off('ack');
        clients[id].socket.off('syncOp');
      }
      successCallCount = 0;
      //to wait for users to leave room
      setTimeout(() => {
        for (const id in clients) {
          clients[id].socket.emit('joinFile', file.id);
        }
      }, 1000);
      setTimeout(() => {
        if (joinFileCount === 3) {
          resolve();
        }
      }, 3000);
    });
  });
  it('one client sends operation at once', (done) => {
    //key: callCount value: expected outout
    const expected1 = {
      1: {
        revisionID: 1
      }
    };
    const expected2 = {
      1: {
        revisionID: 1,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.DELETE,
            position: 6,
            count: -1
          }
        ]
      }
    };
    registerAckCallback(clients[1], expected1, 3, done);
    registerSyncOpCallback(clients[2], expected2, 3, done);
    registerSyncOpCallback(clients[3], expected2, 3, done);
    clients[1].socket.emit('operation', clients[1].revisionID, op1);
  });
  it('one client sends operation separately', (done) => {
    //key: callCount value: expected outout
    const expected1 = {
      1: {
        revisionID: 1
      },
      2: {
        revisionID: 2
      }
    };
    const expected2 = {
      1: {
        revisionID: 1,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          }
        ]
      },
      2: {
        revisionID: 2,
        operation: [
          {
            type: OP_TYPE.DELETE,
            position: 6,
            count: -1
          }
        ]
      }
    };
    const cb = () => {
      clients[1].socket.emit('operation', clients[1].revisionID, [op1[1]]);
    };
    registerAckCallback(clients[1], expected1, 6, done, cb);
    registerSyncOpCallback(clients[2], expected2, 6, done);
    registerSyncOpCallback(clients[3], expected2, 6, done);
    clients[1].socket.emit('operation', clients[1].revisionID, [op1[0]]);
  });
  it('two clients send operation sequentially', (done) => {
    //key: callCount value: expected outout
    const expected1 = {
      1: {
        revisionID: 1
      },
      2: {
        revisionID: 2,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.DELETE,
            position: 6,
            count: -1
          }
        ]
      }
    };
    const expected2 = {
      1: {
        revisionID: 1,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.DELETE,
            position: 6,
            count: -1
          }
        ]
      },
      2: {
        revisionID: 2
      }
    };
    const expected3 = {
      1: {
        revisionID: 1,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.DELETE,
            position: 6,
            count: -1
          }
        ]
      },
      2: {
        revisionID: 2,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.DELETE,
            position: 6,
            count: -1
          }
        ]
      }
    };
    const cb = () => {
      clients[2].socket.emit('operation', clients[2].revisionID, op2);
    };
    registerAckCallback(clients[1], expected1, 6, done);
    registerAckCallback(clients[2], expected2, 6, done);
    registerSyncOpCallback(clients[1], expected1, 6, done);
    registerSyncOpCallback(clients[2], expected2, 6, done, cb);
    registerSyncOpCallback(clients[3], expected3, 6, done);
    clients[1].socket.emit('operation', clients[1].revisionID, op1);
  });
  it('two clients send operation as if simultaneously', (done) => {
    //key: callCount value: expected outout
    const expected1 = {
      1: {
        revisionID: 1
      },
      2: {
        revisionID: 2,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.NOOP,
            position: 7,
            count: -1
          }
        ]
      }
    };
    const expected2 = {
      1: {
        revisionID: 1,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.DELETE,
            position: 6,
            count: -1
          }
        ]
      },
      2: {
        revisionID: 2
      }
    };
    const expected3 = {
      1: {
        revisionID: 1,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.DELETE,
            position: 6,
            count: -1
          }
        ]
      },
      2: {
        revisionID: 2,
        operation: [
          {
            type: OP_TYPE.INSERT,
            position: 4,
            key: 'a'
          },
          {
            type: OP_TYPE.NOOP,
            position: 7,
            count: -1
          }
        ]
      }
    };
    registerAckCallback(clients[1], expected1, 6, done);
    registerAckCallback(clients[2], expected2, 6, done);
    registerSyncOpCallback(clients[1], expected1, 6, done);
    registerSyncOpCallback(clients[2], expected2, 6, done);
    registerSyncOpCallback(clients[3], expected3, 6, done);
    clients[1].socket.emit('operation', clients[1].revisionID, op1);
    clients[2].socket.emit('operation', clients[2].revisionID, op2);
  });
  after(async () => {
    stub1.restore();
    stub2.restore();
    requester.close();
  });
});
async function registerAckCallback(client, expect, targetCallCount, done, cb) {
  client.socket.on('ack', (revisionID) => {
    chai.expect(revisionID).equal(expect[++client.callCount].revisionID);
    client.revisionID = revisionID;
    successCallCount++;

    if (done && successCallCount === targetCallCount) {
      done();
    } else if (client.callCount < 2 && cb) {
      cb();
    }
  });
}
async function registerSyncOpCallback(
  client,
  expect,
  targetCallCount,
  done,
  cb
) {
  client.socket.on('syncOp', (revisionID, operation) => {
    chai.expect(revisionID).equal(expect[++client.callCount].revisionID);
    chai.expect(operation).to.deep.equal(expect[client.callCount].operation);
    client.revisionID = revisionID;
    successCallCount++;
    if (done && successCallCount === targetCallCount) {
      done();
    } else if (client.callCount < 2 && cb) {
      cb();
    }
  });
}
async function addVaultUser(accessToken, emails) {
  return await requester
    .post('/api/vault/users')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ emails, vault_id: vault.id });
}
async function signUp(user) {
  const res = await requester
    .post('/api/user/signup')
    .send({ name: user.name, email: user.email, password: user.password });
  const data = res.body.data;
  user.id = data.user.id;
  return data.access_token;
}
function establishConnection(accessToken) {
  const socket = io(`${socketURL}/${vault.id}`, {
    auth: { token: accessToken }
  });
  socket.on('fileSystem', () => {
    socket.emit('joinFile', file.id);
  });
  socket.on('init', () => {
    joinFileCount++;
  });
  return socket;
}
