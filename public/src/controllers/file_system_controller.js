import BaseController from "./base_controller.js"
import {Node} from '../utils/utils.js'

class FileSystemController extends BaseController{
  constructor (operation, fileSystem, socketIO, api){
    super(operation, fileSystem, socketIO, api)

  }
  init() {
    this.socketIO.init(1, 'abc')
    const callbacks = {
      fileSystem: this.constructFileSystem.bind(this)
    }
    console.log('start filesystem')
    this.socketIO.registerCallbacks(callbacks)
    //addEventListers: an unorthodox approach (for simplification)
    this.addNoteListClickListener()
    this.addOptionsListener()
    this.addNoteListDragListener()
  }
  constructFileSystem(firstChild, fileArr) {
    const nodeMap = {}
    //we do not use vault id as root id to avoid duplicate key bwtween vault and files
    const root = new Node(0, firstChild, null, DATA_TYPE.VAULT, 'root')
    nodeMap[0] = root
    for (const data of fileArr){
      const node = new Node(data.id, data.firstChild, data.next, data.type, data.name)
      nodeMap[node.id] = node
    }
    console.log(nodeMap)
    this.fileSystem.buildTree(nodeMap, this.buildFileOrFolder.bind(this))
    // this.fileSystem.printTree()
  }
  buildFileOrFolder(id, name, type, depth) {
    if (type == DATA_TYPE.FOLDER){
      const folder =  buildFolder(id, name)
      folder.dataset.type = DATA_TYPE.FOLDER
      const node = this.fileSystem.nodeMap
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
    console.log(element, isHiding)
    const icon = getElement('.sort-down-icon', element)
    console.log(icon)
    if (isHiding){
      icon.classList.remove('fa-sort-down')
      icon.classList.add('fa-caret-right')
    } else{
      icon.classList.add('fa-sort-down')
      icon.classList.remove('fa-caret-right')
    }
  }
  showHiddenFiles(id, isHiding, isFirst) {
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
    } else if (node.next !== null && !isFirst){
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
      id = await this.api.createElement(data)
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
        lastChildID = -1
      }
      id = await this.api.createElement(data)
      node = new Node(id, null, null, type, 'Untitled')
      this.fileSystem.insertUnder(node, head)
    }
    this.fileSystem.nodeMap[id] = node
    return [id, prevID, node.depth]
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
      console.log(name, node.name)
      p.style['pointer-events'] = 'none'
      p.setAttribute("contenteditable", false)
      if ((/^\s*$/).test(name) || name == node.name){
        p.innerText = node.name
        return
      } 
      node.name = name
      this.socketIO.changeName(node.id, name, node.type)
    })
  }
  addNoteListDragListener() {
    noteList.addEventListener('dragend', (e) => {
      console.log(dragTarget)
        e.target.classList.remove('dragging')
        if (dragTarget !== null){
          if (dragTarget.matches('.note-list')){
            this.moveFile(e.target.dataset.id, this.fileSystem.head.id, true)
            return
          }
          const element = this.moveFile(e.target.dataset.id, dragTarget.dataset.id, true)
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
  moveFile(id, targetID, isFirst) {
    let node = this.fileSystem.nodeMap[id]
    let targetNode = this.fileSystem.nodeMap[targetID]
    if (targetNode.id != this.fileSystem.head.id){
      if (targetNode.parent.id == node.id)
        return null
    }
    const element = domMap[id].cloneNode(true)
    domMap[id].remove()
    domMap[id] = element
    if (isFirst){
      const type = targetNode.type
      const prevElem = domMap[targetID]
      if(type == DATA_TYPE.FOLDER){
      console.log(node, targetNode)
        this.fileSystem.moveUnderAsFirstChild(node, targetNode)
        insertAfter(element, prevElem)
      } else if (type == DATA_TYPE.VAULT){
        this.fileSystem.moveUnder(node, targetNode)
        noteList.append(element)
      } else {
        this.fileSystem.moveAfter(node, targetNode)
        insertAfter(element, prevElem)
      }
    } else if (node.next !== null){
      this.moveFile(node.next.id, node.id, false)
    }
    if (node.firstChild !== null){
      this.moveFile(node.firstChild.id, node.id, false)
    }
    let paddingLeft = node.depth*15
    if(node.type == DATA_TYPE.FILE){
      paddingLeft += 5
    }
    element.style.paddingLeft= `${paddingLeft}px`
    return element
    //this.fileSystem.printTree()
  }
}



export default FileSystemController