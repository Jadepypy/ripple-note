const app = require('../app');
const chai = require('chai')
const chaiHttp = require('chai-http')
const io = require('socket.io-client')
const { OP_TYPE } = require('../util/operation_transformation')
const {createFakeData, deleteFakeData} = require('./test_data_generator')
const NODE_ENV = process.env.NODE_ENV
const {users, vault, file} = require('./fake_data');

chai.use(chaiHttp);
const requester = chai.request(app).keepOpen()
const socketURL = `http://localhost:3000`
let joinFileCount = 0

describe('send operation to server via socket io', function (){
  this.timeout(5000)
  const clients = {1: {}, 2: {}, 3: {}}
  let op1, op2, op3
  before(() => {
    return new Promise(async (resolve) => {
      if (NODE_ENV !== 'test') {
        console.log('Not in test env')
        return
      }
      await deleteFakeData()
      clients[1].accessToken = await signUp(users[0])
      await createFakeData()
      await addVaultUser(clients[1].accessToken, [users[1].email, users[2].email])
      clients[2].accessToken = await signUp(users[1])
      clients[3].accessToken = await signUp(users[2])
      clients[1].socket = establishConnection(clients[1].accessToken)
      clients[2].socket = establishConnection(clients[2].accessToken)
      clients[3].socket = establishConnection(clients[3].accessToken)
      op1 = [{
                      type: OP_TYPE.INSERT,
                      position: 4,
                      key: 'a'
                    }, 
                    {
                      type: OP_TYPE.DELETE,
                      position: 6,
                      count: -1
                    }]
      op2 = [{
                      type: OP_TYPE.INSERT,
                      position: 4,
                      key: 'a'
                    }, 
                    {
                      type: OP_TYPE.DELETE,
                      position: 6,
                      count: -1
                    }]
      op3 = [{
                      type: OP_TYPE.INSERT,
                      position: 4,
                      key: 'a'
                    }, 
                    {
                      type: OP_TYPE.DELETE,
                      position: 6,
                      count: -1
                    }]
      setTimeout(() => {
        if(joinFileCount === 3){
          resolve()
        }
      }, 3000)
    })
  })
  beforeEach(() => {
    for (const id in clients){
      clients[id].revisionID = 0
      clients[id].callCount = 0
    }
  })
  it('one client sends operation at once',  (done) => {
    //key: callCount value: expected outout
    const expected1 = {
      1: {
        revisionID: 1
      }
    }
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
    }
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
      }
    }
    console.log('send')
    registerAckCallback (clients[1], expected1)
    registerSyncOpCallback(clients[2], expected2, 1, done)
    registerSyncOpCallback(clients[3], expected3, 1, done)
    clients[1].socket.emit('operation', clients[1].revisionID, op1)
  })
  after(async () => {
    requester.close();
  })
})
async function registerAckCallback (client, expect, maxCallCount, done){
  client.socket.on('ack', (revisionID) => {
    chai.expect(revisionID).equal(expect[++client.callCount].revisionID)
    client.revisionID = revisionID
    if(done && client.callCount === maxCallCount){
      done()
    }
  })
}
async function registerSyncOpCallback(client, expect, maxCallCount, done){
  client.socket.on('syncOp', (revisionID, operation) => {
    chai.expect(revisionID).equal(expect[++client.callCount].revisionID)
    chai.expect(operation).to.deep.equal(expect[client.callCount].operation)
    client.revisionID = revisionID
    if(done && client.callCount === maxCallCount){
      done()
    }
  })
}
async function addVaultUser(accessToken, emails){
  return await requester
              .post('/api/vault/users')
              .set('Authorization', `Bearer ${accessToken}`)
              .send({emails, vault_id: vault.id});
}
async function signUp(user){
  const res = await requester
      .post('/api/user/signup')
      .send({name: user.name, email: user.email, password: user.password});
  const data = res.body.data;
  user.id = data.user.id
  return data.access_token
}
function establishConnection(accessToken){
  const socket = io(`${socketURL}/${vault.id}`, {auth: {token: accessToken}})
  socket.on('fileSystem', () => {
    socket.emit('joinFile', file.id)
  })
  socket.on('init', () => {
    joinFileCount++
  })
  return socket
}