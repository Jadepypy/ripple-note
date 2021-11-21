import BaseController from "./base_controller.js"
import {Node} from '../utils/utils.js'

class FileSystemController extends BaseController{
  constructor (operation, fileSystem, socketIO, api){
    super(operation, fileSystem, socketIO, api)
  }
  init() {
    //this.socketIO.init(1, 'abc')
    const storage = window.sessionStorage
    const accessToken =  storage.getItem('access_token')
    const vaultID =  storage.getItem('vault_id')
    if(accessToken != null && vaultID == null){
       this.selectVault(true)
    } else if (accessToken == null || vaultID == null){
      $(window).on('load', () => {
        $('#sign-in-modal').modal({
            backdrop: 'static',
            keyboard: false
        })
        $('#sign-up-modal').modal({
            backdrop: 'static',
            keyboard: false
        })
        $('#sign-in-modal').modal('show')
      })
    } else {
      this.socketIO.init(vaultID, accessToken)
    }

    const callbacks = {
      fileSystem: this.constructFileSystem.bind(this),
      changeName: this.changeName.bind(this),
      createFile: this.receiveNewFile.bind(this),
      moveFile: this.receiveMoveFile.bind(this),
      removeFiles: this.receiveRemoveFiles.bind(this),
      invalid: this.handleInvalidAction.bind(this),
      leaveVault: this.receiveLeaveVault.bind(this)
    }
    this.socketIO.registerCallbacks(callbacks)
    //addEventListers: an unorthodox approach to put under controller (for simplification)
    this.addNoteListClickListener()
    this.addOptionsListener()
    this.addNoteListDragListener()
    this.addVaultIconListener()
    this.addLogInFormListener()
    this.addVaultListListener()
    this.addSettingIconListener()
    this.addLeaveBtnClickListener()
    this.addUserBtnClickListener()
    this.addVaultNameInputBlurListener()
    this.addSaveBtnClickListener()
    this.addUserIconClinkListener()
    this.addSearchBoxBlurListener()
    this.addHistoryIconClickListener()
  }
  constructFileSystem(firstChild, fileArr) {
    showEditor(false)
    const nodeMap = {}
    domMap = {}
    noteList.innerHTML = ''
    //we do not use vault id as root id to avoid duplicate key bwtween vault and files
    const root = new Node(0, firstChild, null, DATA_TYPE.VAULT, 'root')
    nodeMap[0] = root
    for (const data of fileArr){
      const node = new Node(data.id, data.firstChild, data.next, data.type, data.name)
      nodeMap[node.id] = node
    }
    //console.log(nodeMap)
    this.fileSystem.buildTree(nodeMap, this.buildFileOrFolder.bind(this))
    // this.fileSystem.printTree()
    const fileID = window.sessionStorage.getItem('file_id')
    if(fileID != null){
      //console.log('send')
      const file = domMap[fileID]
      this.changeSelectedFile(file)
    } else{
      this.changeSelectedFile(null)
    }
  }
  buildFileOrFolder(id, name, type, depth, isSearch) {
    if (type == DATA_TYPE.FOLDER){
      const folder =  buildFolder(id, name)
      folder.dataset.type = DATA_TYPE.FOLDER
      //const node = this.fileSystem.nodeMap
      const paddingLeft = depth*15
      folder.style.paddingLeft= `${paddingLeft}px`
      return folder
    } else {
      let file
      if(isSearch){
        file = buildSearchFile(id, name)
      } else{
        file = buildFile(id, name)
      }
      const paddingLeft = depth*15 + 5
      file.style.paddingLeft= `${paddingLeft}px`
      file.dataset.type = DATA_TYPE.FILE
      return file
    }
  }
  changeFolderIcon(element, isHiding){
    if(!element.matches('.folder')){
      return
    }
    //console.log(element, isHiding)
    const icon = getElement('.sort-down-icon', element)
    //console.log(icon)
    if (isHiding){
      icon.classList.remove('fa-sort-down')
      icon.classList.add('fa-caret-right')
    } else{
      icon.classList.add('fa-sort-down')
      icon.classList.remove('fa-caret-right')
    }
  }
  showHiddenFiles(id, isHiding, isFirst) {
    //console.log(id)
    const element = domMap[id]
    const node = this.fileSystem.nodeMap[id]
    if(!isFirst){
      element.classList.toggle('hidden', isHiding)
      if(isHiding){
        //element.style.display = 'none'
        element.classList.toggle('opened', !isHiding)
        element.classList.toggle('closed', isHiding)
        this.changeFolderIcon(element, isHiding)
      } 
      // else{
      //   element.style.display = ''
      // }
    } else{
      element.classList.toggle('opened', !isHiding)
      element.classList.toggle('closed', isHiding)
      this.changeFolderIcon(element, isHiding)
    }
    if (node.firstChild !== null && (isFirst ||isHiding)){
      this.showHiddenFiles(node.firstChild.id, isHiding)
    }
    if (node.next !== null && !isFirst){
      this.showHiddenFiles(node.next.id, isHiding)
    }
    //this.fileSystem.printTree()
  }
  //create folder or file
  addOptionsListener(){
    options.addEventListener('click', async (e) => {
      const target = e.target
      if(!target.matches('#folder-option') && !target.matches('#file-option'))
        return
      let element
      if(target.matches('#folder-option')){
        let [id, prevID, depth] = await this.createFileOrFolder(DATA_TYPE.FOLDER)
        element = createFolderOrFile(DATA_TYPE.FOLDER, id, prevID, depth)
        const p = getElement('p', element)
        p.innerText = ''
        p.focus()
        this.addBlurListener(p)
        domMap[id] = element
      }
      else if (target.matches('#file-option')){
        let [id, prevID, depth] = await this.createFileOrFolder(DATA_TYPE.FILE)
        element = createFolderOrFile(DATA_TYPE.FILE, id, prevID, depth)
        const p = getElement('p', element)
        p.innerText = ''
        p.focus()
        this.addBlurListener(p)
        this.changeSelectedFile(element, 'Untitled')
        domMap[id] = element
      }
    })
    noteList.addEventListener('click', async (event) => {
      const target = event.target
      //console.log('event', event.target)
     if(target.matches('#new-note')){
        let element
        const targetID = target.parentNode.parentNode.dataset.id
        let [id, prevID, depth] = await this.createFileOrFolder(DATA_TYPE.FILE, targetID)
        element = createFolderOrFile(DATA_TYPE.FILE, id, prevID, depth)
        this.changeSelectedFile(element)
        domMap[id] = element
        const p = getElement('p', element)
        p.innerText = ''
        p.focus()
        this.addBlurListener(p)
        this.showHiddenFiles(targetID, false, true)
        event.stopPropagation()
        return
      }
      if(target.matches('#new-folder')){
        let element
        const targetID = target.parentNode.parentNode.dataset.id
        let [id, prevID, depth] = await this.createFileOrFolder(DATA_TYPE.FOLDER, targetID)
        element = createFolderOrFile(DATA_TYPE.FOLDER, id, prevID, depth)
        domMap[id] = element
        const p = getElement('p', element)
        p.innerText = ''
        p.focus()
        this.addBlurListener(p)
        this.showHiddenFiles(targetID, false, true)
        event.stopPropagation()
        return
      }
    })
  }
  async createFileOrFolder(type, targetID){
    const vaultID = this.socketIO.vaultID
    let node, prevID, parentID, id
    let data = {
                  new:  {
                    type,
                    name: 'Untitled',
                    vault_id: vaultID
                  },
                  vault_id: vaultID,
                  revision_id: this.socketIO.revisionID 
                }
    let result 
    if(targetID){
      parentID = targetID
      const parentNode = this.fileSystem.nodeMap[parentID]
      if (parentNode.firstChild !== null){
        data.new['next_id'] = parentNode.firstChild.id
      }
      data['parent'] = parentNode.id
      result = await this.api.createElement({data})
      if(result.error){
        this.handleInvalidAction()
        return
      }
      id = result.id
      node = new Node(id, null, null, type, 'Untitled')
      prevID = parentID
      this.fileSystem.insertUnderAsFirstChild(node, parentNode)
    }else if(this.fileSystem.file !== null){
      prevID = this.fileSystem.file.dataset.id
      const prevNode = this.fileSystem.nodeMap[prevID]
      data['prev'] = prevNode.id
      if (prevNode.next !== null){
        data.new['next_id'] = prevNode.next.id
      }
      this.openAncestors(prevNode)
      result = await this.api.createElement({data})
      if(result.error){
        this.handleInvalidAction()
        return
      }
      id = result.id
      node = new Node(id, null, null, type, 'Untitled')
      this.fileSystem.insertAfter(node, prevNode)
    } else {
      const head = this.fileSystem.head
      let lastChildID
      if (head.lastChild !== null) {
        lastChildID = head.lastChild.id
        prevID = this.fileSystem.getLastDescendant(head).id
        data['prev'] = lastChildID
      } else{
        prevID = null
        lastChildID = -1
      }
      result = await this.api.createElement({ data })
      if(result.error){
        this.handleInvalidAction()
        return
      }
      id = result.id
      node = new Node(id, null, null, type, 'Untitled')
      this.fileSystem.insertUnder(node, head)
    }
    this.socketIO.createFile(id, prevID, type, this.socketIO.fsRevsionID)
    this.fileSystem.nodeMap[id] = node
    return [id, prevID, node.depth]
  }
  handleInvalidAction(){
    console.log('invalid action!')
    const storage = window.sessionStorage
    alert('Invalid Action')
    const vaultID =  storage.getItem('vault_id')
    const accessToken =  storage.getItem('access_token')
    this.socketIO.init(vaultID, accessToken)
  }
  receiveNewFile(id, prevID, type) {
    const node = new Node(id, null, null, type, 'Untitled')
    if (prevID != null){
      const prevNode = this.fileSystem.nodeMap[prevID]
      if(prevNode.type == DATA_TYPE.FILE){
        this.fileSystem.insertAfter(node, prevNode)
      } else{
        this.fileSystem.insertUnderAsFirstChild(node, prevNode)
      }
    } else{
      this.fileSystem.insertUnder(node, this.fileSystem.head)
      if (this.fileSystem.head.lastChild === null){
        prevID = this.fileSystem.getLastDescendant(head).id
      }
    }
    //this.fileSystem.printTree()
    const element = createFolderOrFile(type, id, prevID, node.depth)
    // if(type == DATA_TYPE.FILE){
    //   this.changeSelectedFile(element)
    // }
    domMap[id] = element
    this.fileSystem.nodeMap[node.id] = node
  }

  addNoteListClickListener(){
    noteList.addEventListener('click', (event) => {
      const target = event.target
      if(target.matches('#remove-btn')){
        const id = target.parentNode.parentNode.dataset.id
        //console.log(id)
        this.removeFiles(id)
        return
      }
      if(target.matches('#rename-btn')){
        const id = target.parentNode.parentNode.dataset.id
        const p = getElement('p', domMap[id])
        this.selectedName = p.innerText
        p.style['pointer-events'] = 'auto'
        p.setAttribute("contenteditable", true)
        if(p.innerText == 'Untitled'){
          p.innerText = ''
        }
        p.focus()
        this.addBlurListener(p)
        return
      }
      if (!target.matches('.file') && !target.matches('.folder'))
        return
      if (event.detail === 1){
          if (target.matches('.folder.opened')){
            target.classList.toggle('opened', false)
            target.classList.toggle('closed', true)
            this.changeFolderIcon(target, true)
            this.showHiddenFiles(target.dataset.id, true, true)
          } else if (target.matches('.folder.closed')) {
            target.classList.toggle('closed', false)
            target.classList.toggle('opened', true)
            this.changeFolderIcon(target, false)
            this.showHiddenFiles(target.dataset.id, false, true)
          } else if (target.matches('.file')) {
            this.changeSelectedFile(target)
          }
        } 
        // else if (event.detail === 2){
        //   const p = getElement('p', target)
        //   this.selectedName = p.innerText
        //   p.style['pointer-events'] = 'auto'
        //   p.setAttribute("contenteditable", true)
        //   this.addBlurListener(p)
        // }
    })
    searchList.addEventListener('click', (event) => {
      const target = event.target
      if (target.matches('.file')) {
        const name = target.children[target.children.length - 1].innerText
        this.changeSelectedFile(target, name)
      }
    })
  }
  addBlurListener(p) {
    p.addEventListener('blur', (e) => {
      const fileID = p.parentNode.dataset.id
      const node = this.fileSystem.nodeMap[fileID]
      let name = p.innerText.trim()
      //console.log(name, node.name)
      p.style['pointer-events'] = 'none'
      p.setAttribute("contenteditable", false)
      if ((/^\s*$/).test(name) || name == node.name){
        p.innerText = node.name
        return
      }
      if(p.innerText.length > 45){
        p.innerText = node.name
        alert('Name is too long')
        return
      }
      if(this.fileSystem.file != null && node.type == DATA_TYPE.FILE){
        if(this.fileSystem.file.dataset.id == node.id){
          noteTitle.value = name
        }
      }
      node.name = name
      this.operation.name = name
      this.socketIO.changeName(node.id, name, node.type)
    })
  }
  removeFiles(id){
    const node = this.fileSystem.nodeMap[id]
    let nodeData
    let nextID = null
    if(node.next !== null){
      nextID = node.next.id
    }
    if(node.prev !== null){
      nodeData = {id: node.prev.id, prop: 'next_id', change_to: nextID}
    } else{
      if(node.parent.id == this.fileSystem.head.id){
        nodeData = {vault_id: node.parent.id, prop: 'first_child_id', change_to: nextID}
      } else{
        nodeData = {id: node.parent.id, prop: 'first_child_id', change_to: nextID}        
      }
    }
    const idArr = this.fileSystem.removeAll(node, [], true)
    const file = this.fileSystem.file
    if(file !== null){
      const fileID = file.dataset.id
      idArr.forEach(id => {
        if(id == fileID){
          this.changeSelectedFile(null)
        }
      })
    }
    this.socketIO.removeFiles(id, idArr, nodeData)
  }
  receiveRemoveFiles(id){
    const node = this.fileSystem.nodeMap[id]
    const idArr = this.fileSystem.removeAll(node, [], true)
    const file = this.fileSystem.file
    if(file !== null){
      const fileID = file.dataset.id
      idArr.forEach(id => {
        if(id == fileID){
          this.changeSelectedFile(null)
        }
      })
    }
  }
  changeName(fileID, name) {
    //console.log(fileID, name)
    const node = this.fileSystem.nodeMap[fileID]
    const dom = domMap[fileID]
    const p = getElement('p', dom)
    node.name = name
    p.innerText = name
    const selectedID = window.sessionStorage.getItem('file_id')
    if(selectedID == fileID){
      this.operation.name = name
      noteTitle.value = name
    }
  }
  addNoteListDragListener() {
    noteList.addEventListener('dragend', (e) => {
      //console.log(dragTarget)
      e.target.classList.remove('dragging')
      if (dragTarget !== null && dragTarget != undefined){
        if (dragTarget.matches('.note-list')){
          this.moveFile(e.target.dataset.id, this.fileSystem.head.id, true, true)
          return
        }
        const element = this.moveFile(e.target.dataset.id, dragTarget.dataset.id, true, true)
        if(element === null){
          return
        }
        this.showHiddenFiles(e.target.dataset.id, true, true)
        if(dragTarget.matches('.folder.closed')){
          this.showHiddenFiles(dragTarget.dataset.id, true, true)
        } else if(dragTarget.matches('.folder.opened')) {
          this.showHiddenFiles(dragTarget.dataset.id, false, true)
        }
      }
      dragTarget = null
    })
  }
  receiveMoveFile(id, targetID){
    this.moveFile(id, targetID, true, false)
    this.showHiddenFiles(id, true, true)
    const target = domMap[targetID]
    if(target){
      if(target.matches('.folder.closed')){
        this.showHiddenFiles(targetID, true, true)
      } else if(target.matches('.folder.opened')) {
        this.showHiddenFiles(targetID, false, true)
      }
    }
  }
  checkValidity(node, targetNode){
    if (targetNode.id != this.fileSystem.head.id){
      if(this.fileSystem.checkIsAncestor(node, targetNode)){
        console.log('ineffective1')
        return false
      }
      if (targetNode.next !== null && targetNode.type == DATA_TYPE.FILE){
        if(targetNode.next.id == node.id){
          console.log('ineffective2')
          return false
        }
      } else if(targetNode.firstChild !== null && targetNode.type == DATA_TYPE.FOLDER) {
        if(targetNode.firstChild.id == node.id){
          console.log('ineffective3')
          return false
        }
      }
    } else if (this.fileSystem.head.lastChild.id == node.id){
      return false
    }
    return true
  }
  moveFile(id, targetID, isFirst, isNotSent) {
    //console.log('moveFile', id, targetID, isFirst, isNotSent)
    let node = this.fileSystem.nodeMap[id]
    let targetNode = this.fileSystem.nodeMap[targetID]
    if(isFirst){
      if(!this.checkValidity(node, targetNode)){
        return
      }
    }
    const element = domMap[id].cloneNode(true)
    domMap[id].remove()
    domMap[id] = element
    if (isFirst){
      if(isNotSent){
        //console.log('sent')
        this.sendMoveMessage(node, targetNode)
      }
      const type = targetNode.type
      const prevElem = domMap[targetID]
      if(type == DATA_TYPE.FOLDER){
        this.fileSystem.moveUnderAsFirstChild(node, targetNode)
        insertAfter(element, prevElem)
      } else if (type == DATA_TYPE.VAULT){
        this.fileSystem.moveUnder(node, targetNode)
        noteList.append(element)
      } else {
        this.fileSystem.moveAfter(node, targetNode)
        insertAfter(element, prevElem)
      }
    } else{
      const prevElem = domMap[targetID]
      insertAfter(element, prevElem)
    }
    if (node.firstChild !== null){
      this.moveFile(node.firstChild.id, node.id, false)
    }
    if (node.next !== null && !isFirst){
      this.moveFile(node.next.id, node.id, false)
    }
    let paddingLeft = node.depth*15
    if(node.type == DATA_TYPE.FILE){
      paddingLeft += 5
    }
    element.style.paddingLeft= `${paddingLeft}px`
    if(node.parent.id == this.fileSystem.head.id){
      element.classList.toggle('hidden', false)
    }
    if(this.fileSystem.file != null){
      if(this.fileSystem.file.dataset.id == id){
        this.fileSystem.file = domMap[id]
      }
    }
    return element
    //this.fileSystem.printTree()
  }
  openAncestors(node){
    //console.log('enter node', node.id, node.parent.id)
    if(node.type == DATA_TYPE.FOLDER){
      this.showHiddenFiles(node.id, false, true)
    }
    if(node.parent.id !== this.fileSystem.head.id){
      return this.openAncestors(node.parent)
    }
    return
  }
  sendMoveMessage(node, targetNode){
    let before, after
    const nodeData = {id: node.id, prop: 'next_id', change_to: null}
    let nextID = null
    if(node.next !== null){
      nextID = node.next.id
    }
    if(node.prev !== null){
      before = {id: node.prev.id, prop: 'next_id', change_to: nextID}
    } else{
      if(node.parent.id == this.fileSystem.head.id){
        before = {vault_id: node.parent.id, prop: 'first_child_id', change_to: nextID}
      } else{
        before = {id: node.parent.id, prop: 'first_child_id', change_to: nextID}        
      }
    }
    if(targetNode.type == DATA_TYPE.FILE){
      after = {id: targetNode.id, prop: 'next_id', change_to: node.id}
      nodeData.change_to = targetNode.next === null? null: targetNode.next.id
    } else if (targetNode.id == this.fileSystem.head.id){
      const id = this.fileSystem.head.lastChild.id
      after = {id, prop: 'next_id', change_to: node.id}
      nodeData.change_to = null
    } else{
      after = {id: targetNode.id, prop: 'first_child_id', change_to: node.id}
      nodeData.change_to = targetNode.firstChild === null? null: targetNode.firstChild.id
    }
    this.socketIO.moveFile([nodeData, before, after], node.id, targetNode.id)
  }

  addLogInFormListener(){
    signUpForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const result = await submitFormData(event.target.action, event.target, FORM_TYPE.SIGN_UP)
      if(result){
        this.socketIO.init(result[0], result[1])
      }
    })

    signInForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const result = await submitFormData(event.target.action, event.target, FORM_TYPE.SIGN_IN)
      if(result){
        this.socketIO.init(result[0], result[1])
      }
    })
  }
  async selectVault(isForced){
    const result = await this.api.getVaults()
    const data = result.data
    if(!data.vaults){
      return
    } 
    //this.vaultSet = new Set()
    const storage = window.sessionStorage
    if(isForced){
      vaultModal._config.backdrop = 'static'
      vaultModal._config.keyboard = false
      vaultCloseBtn.classList.toggle('hidden', true)
    } else{
      vaultModal._config.backdrop = true
      vaultModal._config.keyboard = true
      vaultCloseBtn.classList.toggle('hidden', false)
    }
    vaultList.innerHTML = ''
    if(data.vaults.length == 0){
      vaultList.innerHTML = `<h4 style="text-align: center; padding-top: 50px;">No existing vault</h4>`
    }
    for (const vault of data.vaults){
      const a = createElement('a', ['list-group-item', 'list-group-item-action', 'vault-element'])
      if(storage.getItem('vault_id') == vault.id){
        a.classList.add('active')
      }
      a.dataset.id = vault.id
      a.innerHTML = `${vault.name}<small class="vault-created-time">${vault.created_at}</small>`
      a.dataset.id = vault.id
      //this.vaultSet.add(String(vault.id))
      vaultList.append(a)
    }
    $('#vault').modal('toggle');
  }
  receiveLeaveVault(){
    const storage = window.sessionStorage
    storage.removeItem('vault_id')
    storage.removeItem('file_id')
    location.reload()
  }
  addVaultIconListener(){
    vaultIcon.addEventListener('click', () => {
      const storage = window.sessionStorage
      if(storage.getItem
    ('access_token') !== null){
        this.selectVault()
      } else{
        $('#sign-in-modal').modal('toggle')
      }
    })
  }
  async addVaultListListener(){
    enterBtn.addEventListener('click', async (event) => {
      event.preventDefault()
      const vault = vaultInput.value.trim()
      if ((/^\s*$/).test(vault)){
        vaultInput.value = ''
        return
      }
      const storage = window.sessionStorage
      const result = await this.api.createVault(vault)
      const newVaultID = result.data.id
      $('#vault').modal('toggle');
      vaultInput.value = ''
      storage.setItem('vault_id', newVaultID)
      storage.removeItem('file_id')
      this.socketIO.init(newVaultID, storage.getItem('access_token'))
      
    })
    vaultInput.addEventListener('keydown', async (event) => {
      if(event.key != 'Enter'){
        return
      } else{
        event.preventDefault()
      }
      const vault = vaultInput.value.trim()
      if ((/^\s*$/).test(vault)){
        vaultInput.value = ''
        return
      }
      const storage = window.sessionStorage
      const result = await this.api.createVault(vault)
      const newVaultID = result.data.id
      $('#vault').modal('toggle');
      vaultInput.value = ''
      storage.setItem('vault_id', newVaultID)
      storage.removeItem('file_id')
      this.socketIO.init(newVaultID, storage.getItem('access_token'))
      
    })
    vaultList.addEventListener('click', (event) => {
      event.preventDefault()
      const target = event.target
      if(target.matches('.vault-element')){
        const storage = window.sessionStorage
        $('#vault').modal('toggle');
        const vaultID = target.dataset.id
        storage.setItem('vault_id', vaultID)
        storage.removeItem('file_id')
        this.socketIO.init(vaultID, storage.getItem('access_token'))
      }
    })
  }
  addSettingIconListener(){
    //console.log(settingIcon)
    settingIcon.addEventListener('click', async () => {
      const storage = window.sessionStorage
      if(storage.getItem('access_token') !== null){
        settingError.innerText = ''
        if(storage.getItem('vault_id') != DEMO_VAULT_ID){
          await this.getSetting()
        } else{
          await this.selectVault()
        }
      } else{
        $('#sign-in-modal').modal('toggle')
      }
    })
  }
  async getSetting(){
    const storage = window.sessionStorage
    const vaultID =  storage.getItem('vault_id')
    const result = await this.api.getVault(vaultID)
    const users = result.data.users
    vaultNameInput.value = users[0].name
    userEmailList.innerHTML = ''
    this.vaultUserEmails = new Set()
    this.newVaultUserEmails = new Set()
    this.vaultName = users[0].name
    this.vaultNameChanged = false
    for (const user of users){
      const li = createElement('li', ['user-email'])
      li.innerText = user.email
      this.vaultUserEmails.add(user.email)
      userEmailList.append(li)
    }
    $('#setting-modal').modal('toggle')

  }
  addLeaveBtnClickListener(){
    LeaveBtn.addEventListener('click', async (event) => {
      event.preventDefault()
      let confirmLeave = confirm('You will no longer have access to this vault. Do you want to proceed?')
      if(!confirmLeave){
        return
      }
      const storage = window.sessionStorage
      const vaultID =  storage.getItem('vault_id')
      storage.removeItem('vault_id')
      await this.api.deleteVault(vaultID)
      this.socketIO.disconnect()
      $('#setting-modal').modal('toggle')
      this.selectVault(true)
      //storage.setItem('vault_id', DEMO_VAULT_ID)
      //location.reload();
    })
  }
  addUserBtnClickListener() {
    addUserBtn.addEventListener('click', (event) => {
      event.preventDefault()
      const email = addUserInput.value.trim()
      this.addUserEmail(email)
    })
    addUserInput.addEventListener('keydown', (event) => {
      settingError.innerText = ''
      if(event.key != 'Enter'){
        return
      }
      event.preventDefault()
      const email = addUserInput.value.trim()
      this.addUserEmail(email)
    })
  }
  async addUserEmail(email){
    if((/^\s*$/).test(email)){
      settingError.innerText = 'Email can not be empty'
      return false
    }
    if(!this.validateEmail(email)){
      settingError.innerText = 'Email format invalid'
      return false
    }
    if (this.vaultUserEmails.has(email) || this.newVaultUserEmails.has(email)){
      settingError.innerText = 'Email already exists'
      return false
    }
    const storage = window.sessionStorage
    const vaultID = storage.getItem('vault_id')
    this.newVaultUserEmails.add(email)
    const li = createElement('li', ['user-email'])
    li.innerText = email
    $('#user-email-list').prepend(li)
    const data = {
      vault_id: vaultID,
      emails: [...this.newVaultUserEmails]
    }
    await this.api.addVaultUsers(data)
    addUserInput.value = ''
    return true
  }
  addVaultNameInputBlurListener() {
    vaultNameInput.addEventListener('blur', (event) => {
      event.preventDefault()
      const vaultName = vaultNameInput.value.trim()
      if((/^\s*$/).test(vaultName)){
        vaultNameInput.value = this.vaultName
        return
      } else{
        if(this.vaultName != vaultName){
          this.vaultNameChanged = true
        }
        this.vaultName = vaultName
        vaultNameInput.value = vaultName
      }
    })
  }
  async addSaveBtnClickListener() {
    saveBtn.addEventListener('click', async (event) => {
      //console.log('click')
      event.preventDefault()
      const storage = window.sessionStorage
      const vaultID = storage.getItem('vault_id')
      if(this.vaultNameChanged){
        await this.api.changeVaultName(vaultID, {name: this.vaultName})
      }
      const email = addUserInput.value.trim()
      if(email.length > 0){
        const hasAdded = await this.addUserEmail(email)
        if(!hasAdded){
          console.log('?')
          return
        }
      }
      $('#setting-modal').modal('toggle')
    })
  }
  addUserIconClinkListener(){
    userCircle.addEventListener('click', async () => {
      const result = await this.api.getUserProfile()
      const data = result.data
      userName.value = data.name
      userEmail.value = data.email
    })
  }
  addSearchBoxBlurListener(){
    searchBox.addEventListener('change', async (event) => {
      const keyword = searchBox.value.trim()
      await this.searchFiles(keyword)
    })
    searchTool.addEventListener('click', async () => {
      const keyword = searchBox.value.trim()
      await this.searchFiles(keyword)
    })
    navigationTool.addEventListener('click', () => {
      const storage = window.sessionStorage
      const fileID = storage.getItem('file_id')
      if(fileID != null){
        this.changeSelectedFile(domMap[fileID])
      } 
    })
  }
  async searchFiles(keyword){
    searchList.innerHTML = ''
    if(keyword.length > 0){
      const storage = window.sessionStorage
      const vaultID = storage.getItem('vault_id')
      const result = await this.api.searchFiles(vaultID, keyword)
      const ids = result.data
      this.buildSearchList(ids)
    }
  }
  buildSearchList(ids){
    if(ids.length == 0){
      searchList.innerHTML = '<p id="no-matches">No matches found.</p>'
      return
    }
    const storage = window.sessionStorage
    const fileID = storage.getItem('file_id')
    searchDomMap = {}
    ids.forEach((id) => {
      const name = this.fileSystem.nodeMap[id].name
      searchDomMap[fileID] = this.buildFileOrFolder(id, name, DATA_TYPE.FILE, 1, true)
      if(fileID != null && fileID == id){
        this.changeSelectedFile(searchDomMap[fileID], name)
      } 
    })    
  }
  addHistoryIconClickListener(){
    historyIcon.addEventListener('click', async () => {
      toggleEditorDisplay(false)
      if(!this.selectedVersion){
        this.currentRevisionID = this.operation.revisionID
        this.currentDoc = textarea.value
      }
      const storage = window.sessionStorage
      const fileID = storage.getItem('file_id')
      if(!this.socketIO.isFreezed){
        const result = await this.api.getFileVersion(fileID)
        const files = result.data.files
        historyList.innerHTML = ''
        for(let i = 0; i < files.length; i++){
          let file = files[i]
          let updatedAt = i != 0? moment(file.updated_at).format("MMM Do, h:mm:ss a"): 'current'
          const name = file.name == null? 'Untitled': file.name
          const revisionID = file.revision_id
          const a = createElement('a', ['list-group-item', 'list-group-item-action', 'version-history-item'])
          a.setAttribute('aria-current', 'true')
          a.dataset.revision = revisionID
          a.dataset.name = name
          a.dataset.time = updatedAt
          if(this.selectedVersion == revisionID){
            this.selectedVersionItem = a
            this.selectedVersion = revisionID
            a.classList.add('active')
          }
          a.innerHTML = `<div class="vault-vc-container" style="margin-top: 0px;">
                <div class="version-created-time">${updatedAt}</div> 
              <input type="text" class="version-name" placeholder="${name}">
            </div>`
          if(i > 0){
            a.innerHTML += 
          `<button type="button" class="btn btn-block my-auto restore-btn" >Restore</button>`
          }
          if(i == 0 && !this.selectedVersion){
            this.selectedVersionItem = a
            this.selectedVersion = revisionID
            a.classList.add('active')
            await this.handleClickHistoryItem(a, fileID)
          }
          historyList.append(a)
          this.addHistoryListClickListener(a, fileID)
        }
      }
    
    })
  }
  addHistoryListClickListener(a, fileID){
    a.addEventListener('click', async (event) => {
      this.selectedVersionItem.classList.toggle('active', false)
      a.classList.toggle('active', true)
      if(event.target.matches('.restore-btn')){
        let confirmRestore = confirm('Your current document will revert to the version. Do you want to proceed?') 
        if(confirmRestore){
          const revisionID = a.dataset.revision
          this.socketIO.restoreVersion(revisionID)
        }
      }
      await this.handleClickHistoryItem(a, fileID)
    })
  }
  async handleClickHistoryItem(a, fileID){
    this.selectedVersionItem = a
    const revisionID = a.dataset.revision
    this.selectedVersion = revisionID
    let doc
    if(a.dataset.time != 'current'){
      const result = await this.api.getFileVersion(fileID, revisionID)
      doc = result.data.doc
    } else{
      doc = this.currentDoc
    }
    timeStamp.innerHTML = `<i class="fas fa-times" id="unfreezed-icon" title="Close"></i> Freezed: ${a.dataset.time}`
    timeStamp.addEventListener('click', () => {
      this.freezeTextarea(false, fileID)
    })
    this.freezeTextarea(true)
    renderEditor(doc, undefined, undefined, undefined, true)
    const input = getElement('.version-name', a)
    input.addEventListener('blur', async () => {
      const name = input.value.trim()
      if((/^\s*$/).test(name)){
        input.value = a.dataset.name
        return
      } else if (input.value != a.dataset.name){
        const storage = window.sessionStorage
        const fileID = storage.getItem('file_id')
        if(a.dataset.time == 'current'){
          this.socketIO.saveCurrent()
        }
        await this.api.changeVersionName(fileID, {name, revision_id: a.dataset.revision, doc})
        a.dataset.name = name
      }
    })
  }

  validateEmail(mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)){
      return true
    }
    return false
  }
}



export default FileSystemController