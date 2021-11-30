const app = require('../app');
const chai = require('chai')
const chaiHttp = require('chai-http')
const io = require('socket.io-client')
const {createFakeData, deleteFakeData} = require('./test_data_generator')
const { users } = require('./fake_data')
const NODE_ENV = process.env.NODE_ENV
const {vault, file} = require('./fake_data');

chai.use(chaiHttp);
const requester = chai.request(app).keepOpen()
const socketURL = `http://localhost:3000`

let accessToken1, accessToken2, accessToken3
let client1, client2, client3
let client1RevisionID, client2RevisionID, client3RevisionID
describe('send operation to server via socket io', () => {
  before(async () => {
    if (NODE_ENV !== 'test') {
      console.log('Not in test env')
      return
    }
    await deleteFakeData()
    accessToken1 = await signUp(users[0])
    await createFakeData()
    await addVaultUser(accessToken1, [users[1].email, users[2].email])
    accessToken2 = await signUp(users[1])
    accessToken3 = await signUp(users[2])
    client1 = io(`${socketURL}/${vault.id}`, {auth: {token: accessToken1}})
    client2 = io(`${socketURL}/${vault.id}`, {auth: {token: accessToken2}})
    client3 = io(`${socketURL}/${vault.id}`, {auth: {token: accessToken3}})
  })
  beforeEach(() => {
    client1RevisionID = 0
    client2RevisionID = 0
    client3RevisionID = 0
  })
  it('one client sends operation',  (done) => {
    client1.on('ack', (revisionID) => {
      client1RevisionID = revisionID
      expect(client1RevisionID).equal(1);
      done()
    })
    client1.emit('operation', client1RevisionID, [])
  })
  after(async () => {
    requester.close();
  })
})
async function addVaultUser(accessToken, emails){
  const res =  await requester
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