
class API {
  constructor(){
    this.tempCount = 99
    this.API_HOST = 'http://localhost:3000/api'
    this.accessToken = null
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

  getVaults(){
    const storage = window.sessionStorage
    const accessToken = storage.getItem
    ('access_token')
    return fetch(`${this.API_HOST}/user/vaults`, {
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
      }),
    }).then((response) => {
      console.log(response)
      if (response.status === 401) {
        throw new Error('請先登入');
      }
      if (response.status === 403) {
        throw new Error('內容錯誤或權限不足');
      }
      return response.json();
    })
  }
  getVault(vaultID){
    const storage = window.sessionStorage
    const accessToken = storage.getItem
    ('access_token')
    return fetch(`${this.API_HOST}/vault/${vaultID}`, {
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
      }),
    }).then((response) => {
      console.log(response)
      if (response.status === 401) {
        throw new Error('請先登入');
      }
      if (response.status === 403) {
        throw new Error('內容錯誤或權限不足');
      }
      return response.json();
    })
  }
  deleteVault(vaultID){
    const storage = window.sessionStorage
    const accessToken = storage.getItem
    ('access_token')
    return fetch(`${this.API_HOST}/user/vault/${vaultID}`, {
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
      }),
      method: 'DELETE',
    }).then((response) => {
      console.log(response)
      if (response.status === 401) {
        throw new Error('請先登入');
      }
      if (response.status === 403) {
        throw new Error('內容錯誤或權限不足');
      }
      return
    })
  }
  createVault(name) {
    const storage = window.sessionStorage
    const accessToken = storage.getItem('access_token')
    return fetch(`${this.API_HOST}/user/vault`, {
      body: JSON.stringify({name}),
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }),
      method: 'POST',
    }).then((response) => {
      console.log(response)
      if (response.status === 401) {
        throw new Error('請先登入');
      }
      if (response.status === 403) {
        throw new Error('內容錯誤或權限不足');
      }
      return response.json();
    })
  }
  addVaultUsers(data){
    const storage = window.sessionStorage
    const accessToken = storage.getItem('access_token')
    console.log(data)
    return fetch(`${this.API_HOST}/vault/users`, {
      body: JSON.stringify(data),
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }),
      method: 'POST',
    }).then((response) => {
      console.log(response)
      if (response.status === 401) {
        throw new Error('請先登入');
      }
      if (response.status === 403) {
        throw new Error('內容錯誤或權限不足');
      }
      return
    })
  }
  changeVaultName(vaultID, data){
    const storage = window.sessionStorage
    const accessToken = storage.getItem('access_token')
    console.log(data)
    return fetch(`${this.API_HOST}/vault/${vaultID}`, {
      body: JSON.stringify(data),
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }),
      method: 'PATCH',
    }).then((response) => {
      console.log(response)
      if (response.status === 401) {
        throw new Error('請先登入');
      }
      if (response.status === 403) {
        throw new Error('內容錯誤或權限不足');
      }
      return
    })
  }

}

export default API