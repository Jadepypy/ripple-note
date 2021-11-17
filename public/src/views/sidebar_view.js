const sidebar = getElement('.sidebar')
const arrow = getElement('#arrow')
const panel =  getElement('.panel')
const editorContainer = getElement('.editor-container')
const signUpForm = getElement('#signup')
const signInForm = getElement('#signin') 
const signInError = getElement('#signin-error-message') 
const signUpError = getElement('#signup-error-message') 
const vaultList = getElement('#vault-list-sidebar')
const vaultInput = getElement('#vault-input')
const enterBtn = getElement('#enter-btn')
const vaultIcon = getElement('#vault-icon')
const settingIcon = getElement('#setting')
const vaultNameInput = getElement('#vault-name')
const addUserInput = getElement('#add-user-input')
const addUserBtn = getElement('#add-user-btn')
const userEmailList = getElement('#user-email-list')
const LeaveBtn = getElement('#leave-button')
const saveBtn = getElement('#save-button')
const settingError = getElement('#setting-error')
const vaultCloseBtn = getElement('#vault-close-btn')
const vaultModal = new bootstrap.Modal($('#vault'))
const userName = getElement('#user-name')
const userEmail = getElement('#user-email-data')
const userCircle = getElement('#user-circle')
const signOutBtn =  getElement('#sign-out-button')
const FORM_TYPE = {
  SIGN_IN: 0,
  SIGN_UP: 1
}
//add event listeners without need of controller funcitons
arrow.addEventListener('click', () => {
  if (arrow.matches('.fa-angle-double-left')){
    arrow.classList.remove('fa-angle-double-left')
    arrow.classList.add('fa-angle-double-right')
    panel.style.display='none'
    editorContainer.style.gridTemplateAreas = '"main main"';
  } else {
    panel.style.display=''
    arrow.classList.remove('fa-angle-double-right')
    arrow.classList.add('fa-angle-double-left')
    editorContainer.style.gridTemplateAreas = '"side main"';
  }
})
function lengthIsValid(value, type){
  let isValid = true
  let error
  if(value.email.length > 45){
    isValid = false
    error = 'Email length exceeds'
  } else if (value.password.length > 60){
    isValid = false
    error = 'Password length exceeds'
  } else if (value.name){
    if (value.name.length > 45){
      isValid = false
      error = 'Name length exceeds'
    }
  }
  if(!isValid){
    if(type === FORM_TYPE.SIGN_IN){
      signInError.innerText = error
    } else{
      signUpError.innerText = error
    }
    return false
  }
  return true
}
async function submitFormData(url, data, type) {
  const form = new FormData(data)
  const value = Object.fromEntries(form.entries())
  if(!lengthIsValid(value, type)){
    return false
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  })
  if (response.status !== 200) {
    const err = await response.json()
    console.log(err)
    if(type === FORM_TYPE.SIGN_IN){
      signInError.innerText = err.error
    } else{
      signUpError.innerText = err.error
    }
    return false
  } else {
    const result = await response.json()
    const data = result.data
    const storage = window.sessionStorage
    storage.setItem('access_token', data.access_token)
    storage.setItem('vault_id', data.user.last_entered_vault_id)
    if(type === FORM_TYPE.SIGN_IN){
      $('#sign-in-modal').modal('toggle');    
    } else{
      $('#sign-up-modal').modal('toggle');    
    }
    return [data.user.last_entered_vault_id, data.access_token]
  }
}

//add event listeners without need of controller functions
signOutBtn.addEventListener('click', () => {
  const storage = window.sessionStorage
  storage.clear()
  location.reload()
})






