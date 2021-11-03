
class API {
  constructor(){
    this.tempCount = 99
    this.API_HOST = 'http://localhost:3000/api'
    this.accessToken = null
  }
  async signIn(data){

  }
  async createElement(data){
    return fetch(`${this.API_HOST}/file`, {
      body: JSON.stringify(data),
      headers: new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      }),
      method: 'POST'
    }).then(async (res) => {
      if (res.status === 401) {
          throw new Error('請先登入');
      }
      if (res.status === 403) {
        throw new Error('內容錯誤或權限不足');
      }
      const result = await res.json()
      console.log(result)
      return result.id
    })
  }

}

export default API