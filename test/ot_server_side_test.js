const ot = require('../util/operation_transformation')
const chai = require('chai')
const chaiHttp = require('chai-http')
const {createFakeData, deleteFakeData} = require('./test_data_generator')
const { users } = require('./fake_data')
const serverOT = require('../util/operation_transformation')

chai.use(chaiHttp);
const requester = chai.request(app).keepOpen();

const user = {
  email: 'test@gmail.com',
  password: 'password'
}
let doc
describe('send operation to server via socket io', () => {
  before(async () => {
    if (NODE_ENV !== 'test') {
      console.log('Not in test env')
      return
    }
    await createFakeData()
    await deleteFakeData()

    const res1 = await requester
        .post('/api/user/signin')
        .send({email: user[0].email, password: user[0].password});
    const data1 = res1.body.data;
    let accessToken1 = data1.access_token

    const res2 = await requester
        .post('/api/user/signin')
        .send({email: user[1].email, password: user[1].password});
    const data2 = res2.body.data;
    let accessToken2 = data2.access_token

    const res3 = await requester
        .post('/api/user/signin')
        .send({email: user[2].email, password: user[2].password});
    const data3 = res3.body.data;
    let accessToken3 = data3.access_token
  })

  beforeEach()
  it('one client sends operation',  () => {
       
  })
  it('two clients send operation',  () => {
       
  })
  it('three clients send operation',  () => {
       
  })
  after(async () => {

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