import BaseController from "./base_controller.js"
import {Node} from '../utils/utils.js'

class FileSystemController extends BaseController{
  constructor (operation, fileSystem, socketIO, api){
    super(operation, fileSystem, socketIO, api)

  }
  init() {
    const storage = window.sessionStorage
    const accessToken =  storage.getItem('access_token')
    const vaultID =  storage.getItem('vault_id')
    if(accessToken !== null && vaultID !== null){
      this.socketIO.init(vaultID, accessToken)
    } else{
      this.socketIO.init(DEMO_VAULT_ID, '')
    }
    const callbacks = {
      fileSystem: this.constructFileSystem.bind(this),
      changeName: this.changeName.bind(this),
      createFile: this.receiveNewFile.bind(this),
      moveFile: this.receiveMoveFile.bind(this),
    }
    //console.log('start filesystem')
    this.socketIO.registerCallbacks(callbacks)
    //addEventListers: an unorthodox approach (for simplification)
    this.addNoteListClickListener()
    this.addOptionsListener()
    this.addNoteListDragListener()
    this.addVaultIconListener()
    this.addLogInFormListener()
    this.addVaultListListener()
    this.addSettingIconListener()
    this.addLeaveBtnClickListener()
  }
  constructFileSystem(firstChild, fileArr) {
    this.changeSelectedFile(null)
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
  }
  buildFileOrFolder(id, name, type, depth) {
    if (type == DATA_TYPE.FOLDER){
      const folder =  buildFolder(id, name)
      folder.dataset.type = DATA_TYPE.FOLDER
      //const node = this.fileSystem.nodeMap
      const paddingLeft = depth*15
      folder.style.paddingLeft= `${paddingLeft}px`
      return folder
    } else {
      const file = buildFile(id, name)
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
      if(isHiding){
        element.style.display = 'none'
        element.classList.toggle('opened', !isHiding)
        element.classList.toggle('closed', isHiding)
        this.changeFolderIcon(element, isHiding)
      } else{
        element.style.display = ''
      }
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
        domMap[id] = element
      }
      else if (target.matches('#file-option')){
        let [id, prevID, depth] = await this.createFileOrFolder(DATA_TYPE.FILE)
        element = createFolderOrFile(DATA_TYPE.FILE, id, prevID, depth)
        this.changeSelectedFile(element)
        domMap[id] = element
      }
    })
  }
  async createFileOrFolder(type){
    const vaultID = this.socketIO.vaultID
    let node, prevID, id
    let data = {
                  new:  {
                    type,
                    name: 'Untitled',
                    vault_id: vaultID
                  }
                }
    if(this.fileSystem.file !== null){
      prevID = this.fileSystem.file.dataset.id
      const prevNode = this.fileSystem.nodeMap[prevID]
      data['prev'] = prevNode.id
      if (prevNode.next !== null){
        data.new['next_id'] = prevNode.next.id
      }
      id = await this.api.createElement({data})
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
      id = await this.api.createElement({ data })
      node = new Node(id, null, null, type, 'Untitled')
      this.fileSystem.insertUnder(node, head)
    }
    this.socketIO.createFile(id, prevID, type)
    this.fileSystem.nodeMap[id] = node
    return [id, prevID, node.depth]
  }
  receiveNewFile(id, prevID, type) {
    const node = new Node(id, null, null, type, 'Untitled')
    //console.log(id, prevID, type)
    if (prevID != null){
      const prevNode = this.fileSystem.nodeMap[prevID]
      this.fileSystem.insertAfter(node, prevNode)
    } else{
      this.fileSystem.insertUnder(node, this.fileSystem.head)
      if (this.fileSystem.head.lastChild === null){
        prevID = this.fileSystem.getLastDescendant(head).id
      }
    }
    const element = createFolderOrFile(type, id, prevID, node.depth)
    this.changeSelectedFile(element)
    domMap[id] = element
    this.fileSystem.nodeMap[node.id] = node
  }

  addNoteListClickListener(){
    noteList.addEventListener('click',(event) => {
      const target = event.target
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
            target.classList.toggle('selected', true)
            this.changeSelectedFile(target)
          }
        } else if (event.detail === 2){
          const p = getElement('p', target)
          this.selectedName = p.innerText
          p.style['pointer-events'] = 'auto'
          p.setAttribute("contenteditable", true)
          this.addBlurListener(p)
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
      if(node.type == DATA_TYPE.FILE){
        noteTitle.value = name
      }
      this.socketIO.changeName(node.id, name, node.type)
    })
  }

  changeName(fileID, name) {
    //console.log(fileID, name)
    const node = this.fileSystem.nodeMap[fileID]
    const dom = domMap[fileID]
    const p = getElement('p', dom)
    node.name = name
    p.innerText = name
  }
  addNoteListDragListener() {
    noteList.addEventListener('dragend', (e) => {
      //console.log(dragTarget)
        e.target.classList.remove('dragging')
        if (dragTarget !== null){
          if (dragTarget.matches('.note-list')){
            this.moveFile(e.target.dataset.id, this.fileSystem.head.id, true, true)
            return
          }
          const element = this.moveFile(e.target.dataset.id, dragTarget.dataset.id, true, true)
          if(element === null){
            return
          }
          // if(target.matches('.folder.opened')&& e.target.matches('.folder.closed')){
          //   e.target.style.display = ''
          //   this.showHiddenFiles(e.target.dataset.id, false, true)
          // } else if(target.matches('.folder.closed')&& e.target.matches('.folder.opened')) {
          //   element.style.display = 'none'
          //   element.classList.remove('opened')
          //   element.classList.add('closed')
          //   // console.log('current', e.target)
          //   this.showHiddenFiles(e.target.dataset.id, true, true)
          // }
        }
        dragTarget = null
      })
  }
  receiveMoveFile(id, targetID){
    this.moveFile(id, targetID, true, false)
  }
  checkValidity(node, targetNode){
    if (targetNode.id != this.fileSystem.head.id){
      if (targetNode.parent.id == node.id)
        return false
      if (targetNode.next !== null && targetNode.type == DATA_TYPE.FILE){
        if(targetNode.next.id == node.id){
          console.log('ineffective')
          return false
        }
      } else if(targetNode.firstChild !== null && targetNode.type == DATA_TYPE.FOLDER) {
        if(targetNode.firstChild.id == node.id){
          console.log('ineffective')
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
    return element
    //this.fileSystem.printTree()
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
      const isLogIn = await submitFormData(event.target.action, event.target, FORM_TYPE.SIGN_UP)
      if (isLogIn){
        await this.selectVault()
      }
    })

    signInForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const isLogIn = await submitFormData(event.target.action, event.target, FORM_TYPE.SIGN_IN)
      if (isLogIn){
        await this.selectVault()
      }
    })
  }
  async selectVault(){
    $('#vault').modal('toggle');
    const result = await this.api.getVaults()
    const data = result.data
    if(!data.vaults){
      return
    } 
    vaultList.innerHTML = ''
    this.vaultSet = new Set()
    for (const vault of data.vaults){
      const option = createElement('option', [])
      option.value = vault.id
      option.label = vault.created_at + '    ' + vault.name
      this.vaultSet.add(String(vault.id))
      vaultList.append(option)
    }
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
        return
      }
      const storage = window.sessionStorage
      if(this.vaultSet.has(vault)){
        $('#vault').modal('toggle');
        storage.setItem('vault_id', vault)
        this.socketIO.init(vault, storage.getItem('access_token'))
      } else{
        const result = await this.api.createVault(vault)
        const newVaultID = result.data.id
        $('#vault').modal('toggle');
        storage.setItem('vault_id', newVaultID)
        this.socketIO.init(newVaultID, storage.getItem('access_token'))
      }
    })
  }
  addSettingIconListener(){
    settingIcon.addEventListener('click', async () => {
      const storage = window.sessionStorage
      if(storage.getItem('access_token') !== null){
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
    vaultName.value = users[0].name
    userEmailList.innerHTML = ''
    for (const user of users){
      const li = createElement('li', ['user-email'])
      li.innerText = user.email
      userEmailList.append(li)
    }
    $('#setting-modal').modal('toggle')

  }
  addLeaveBtnClickListener(){
    LeaveBtn.addEventListener('click', async (event) => {
      event.preventDefault()
      const storage = window.sessionStorage
      const vaultID =  storage.getItem('vault_id')
      await this.api.deleteVault(vaultID)
      storage.setItem('vault_id', DEMO_VAULT_ID)
      location.reload();
    })
  }

}



export default FileSystemController