const arrow = getElement('#arrow')
const panel =  getElement('.panel')
const editorContainer = getElement('.editor-container')
const signUpForm = getElement('#signup')
const signInForm = getElement('#signin') 
const signInError = getElement('#signin-error-message') 
const signUpError = getElement('#signup-error-message') 
const vaultList = getElement('#vault-list')
const vaultInput = getElement('#vault-input')
const enterBtn = getElement('#enter-btn')
const vaultIcon = getElement('#vault-icon')
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

async function submitFormData(url, data, type) {
  const form = new FormData(data)
  const value = Object.fromEntries(form.entries())
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
    const data = await response.json()
    const storage = window.sessionStorage
    storage.setItem('access_token', data.data.access_token)
    storage.setItem('vault_id', DEMO_VAULT_ID)
    if(type === FORM_TYPE.SIGN_IN){
      $('#sign-in-modal').modal('toggle');    
    } else{
      $('#sign-up-modal').modal('toggle');    
    }
  }
  return true
}







