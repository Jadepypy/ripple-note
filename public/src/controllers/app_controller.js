import {Node} from '../utils/utils.js'
// import {STATE, OP_TYPE} from '../utils/enum.js'

class AppController {
  constructor (operation, fileSystem, panelModel, sidebar, panel, editor, socketIO, api){
    this.operation = operation
    this.fileSystem = fileSystem
    this.panelModel = panelModel
    this.sidebar = sidebar
    this.panel = panel
    this.editor = editor
    this.socketIO = socketIO
    this.api = api

    this.sidebar.bindClickArrow(this.changePanelState.bind(this))
    this.panel.bindClickPanelTools(this.changePanelTool.bind(this))
    this.panel.bindClickNoteList(this.showHiddenFiles.bind(this), this.changeTitle.bind(this), this.addTitleToNewElement.bind(this), this.checkIsDuplicate.bind(this), this.changeSelectedFile.bind(this), this.moveFile.bind(this))
    this.panel.bindClickFolderOptions(this.createNewElement(DATA_TYPE.FOLDER))
    this.panel.bindClickFileOptions(this.createNewElement(DATA_TYPE.FILE))

    this.editor.bindTrashIcon(this.changeSelectedFile.bind(this))
    this.editor.bindTextAreaEdit(this.handleTextAreaOperation.bind(this))
  }
  init() {
    this.socketIO.init(1, 'abc')
    const callbacks = {
      fileSystem: this.constructFileSystem.bind(this),
      init: this.initializeNote.bind(this),
      ack: this.handleAcknowledgement.bind(this),
      syncOp: this.handleSyncOperation.bind(this) 
    }
    console.log('start')
    this.socketIO.registerCallbacks(callbacks)
  }
  constructFileSystem(rootID, dataArr) {
    const nodeMap = {}
    for (const data of dataArr){
      nodeMap[data[0]] = new Node(...data)
    }
    this.fileSystem.buildTree(nodeMap[rootID], nodeMap, this.buildFileOrFolder.bind(this))
    // this.fileSystem.printTree()

  }
  createNewElement(type) {
    return async () => {
      console.log(this.fileSystem.file)
      const vaultID = this.fileSystem.head.id
      const [prevDom, prevNode, parent] = this.fileSystem.getDataBeforeInsertion()
      // console.log('prevDom', prevDom, prevNode)
      let element, name, isRemoved
      if(type === DATA_TYPE.FOLDER){
        element = this.panel.createNewFolder(prevDom, parent.id)
        element.dataset.type = DATA_TYPE.FOLDER
      }
      else if (type === DATA_TYPE.FILE){
        element = this.panel.createNewFile(prevDom, parent.id)
        element.dataset.type = DATA_TYPE.FILE
        this.changeSelectedFile(element)
      }
    }
  }
  buildFileOrFolder(id, name, type, depth) {
    if (type == DATA_TYPE.FOLDER){
      const folder =  this.panel.buildFolder(id, name)
      folder.dataset.type = DATA_TYPE.FOLDER
      const node = this.fileSystem.nodeMap
      const paddingLeft = depth*15
      folder.style.paddingLeft= `${paddingLeft}px`
      return folder
    } else {
      const file = this.panel.buildFile(id, name)
      const paddingLeft = depth*15 + 5
      file.style.paddingLeft= `${paddingLeft}px`
      file.dataset.type = DATA_TYPE.FILE
      return file
    }
  }

  checkIsDuplicate(name, parentID, type, isNew, id) {
    // console.log('Node', id)
    let parent
    if (isNew){
      parent = this.fileSystem.nodeMap[parentID]
    } else{
      const node = this.fileSystem.nodeMap[id]
      if (node.name == name){
        return
      }
      parent = this.fileSystem.nodeMap[id].parent
    }
    const duplicateID = this.fileSystem.getDuplicateElementID(name, parent.firstChild, type, null)
    if (duplicateID !== null){
      if (isNew){
        this.changeSelectedFile(domMap[duplicateID])
      }
      return true
    } 
    return false
  }

  changePanelState (state) {
    this.panelModel.panelState = this.panelModel.PANEL_STATE[state]
  }

  changePanelTool(panelMode) {
    //get notelist from model
    //render notelist
  }
  showHiddenFiles(id, isHiding, isFirst) {
    console.log('id', id)
    const element = domMap[id]
    console.log(element)
    const node = this.fileSystem.nodeMap[id]
    if(!isFirst){
      if(isHiding){
        element.classList.toggle('opened', false)
        element.classList.toggle('closed', true)
        // element.classList.toggle('hidden', isHiding)
        element.classList.toggle('opened', true)
        element.classList.toggle('closed', closed)
        element.style.display = 'none'
        
      } else{
        // element.classList.toggle('hidden', !isHiding)
        element.style.display = ''
      }
    }
    if (node.firstChild !== null){
      this.showHiddenFiles(node.firstChild.id, isHiding)
    }
    if (node.next !== null && !isFirst){
      this.showHiddenFiles(node.next.id, isHiding)
    }
    //this.fileSystem.printTree()
  }
  async addTitleToNewElement(element, name, type, parentID, prevID) {
    // console.log('name', name)
    const id = await this.api.getElementID(this.fileSystem.head.id, parentID, name, type)
    const node = new Node(id, null, null, type, name)
    this.fileSystem.nodeMap[id] = node
    domMap[id] = element
    element.dataset.id = id
    if (prevID !== String(null)){
      const prevNode = this.fileSystem.nodeMap[prevID]
      this.fileSystem.insertAfter(node, prevNode)
    } else{
      const parent = this.fileSystem.nodeMap[parentID]
      this.fileSystem.insertUnder(node, parent)
    }
    if (type == DATA_TYPE.FILE){
      this.changeSelectedFile(element)
    }
    // this.fileSystem.printTree()
  }
  changeTitle (id, name) {
    const node = this.fileSystem.nodeMap[id]
    node.name = name
    // this.fileSystem.printTree()
  }
  
  changeSelectedFile(file) {
    if (this.fileSystem.file !== null){
      this.panel.toggleTag(this.fileSystem.file, 'selected', false)
    }
    this.fileSystem.file = file
    if (file === null){
      return
    } else {
      this.editor.showEditor(true)
    }
    this.panel.toggleTag(file, 'selected', true)
    // console.log(file.dataset.id)
    this.socketIO.joinNote(file.dataset.id)
    this.operation.id = file.dataset.id
    this.operation.name = file.children[file.children.length - 1].innerText
  }
  initializeNote(revisionID, doc) {
    this.operation.revisionID = revisionID
    this.operation.doc = doc
    // console.log(this.operation.name, doc)
    this.editor.renderEditor(doc, this.operation.name)
  }

  handleTextAreaOperation(opInfo){
    let state = this.operation.state
    const outstandingOp = this.operation.outstandingOp
    const bufferOp = this.operation.bufferOp
    const revisionID = this.operation.revisionID
    if (state === STATE.CLEAR){
      outstandingOp.push(...opInfo)
      this.socketIO.sendOperation(revisionID, outstandingOp)
      this.operation.state = STATE.WAITING
    } else {
      bufferOp.push(...opInfo)
    }
    // console.log(outstandingOp)
  }

  handleAcknowledgement(revisionID) {
    this.operation.revisionID = revisionID
    this.operation.state = STATE.CLEAR
    let bufferOp = this.operation.bufferOp
    let outstandingOp = this.operation.outstandingOp

    outstandingOp = []
    if (bufferOp.length > 0){
      //console.log('send operatoin')
      //console.log(bufferOp)
      this.socketIO.sendOperation(revisionID, bufferOp)
      outstandingOp = [...bufferOp]
      this.operation.state = STATE.WAITING
      bufferOp = []
    }
    this.operation.bufferOp = bufferOp
    this.operation.outstandingOp = outstandingOp
  }
  handleSyncOperation(revisionID, syncOp) {
    this.operation.revisionID = revisionID
    let outstandingOp = this.operation.outstandingOp
    let bufferOp = this.operation.bufferOp
    // console.log('GET SYNC:')
    
    // for (const op of syncOp){
    //   console.log(op)
    // }
    if (outstandingOp.length > 0){
      //change syncOp inplace
      //console.log(outstandingOp)
      this.operation.iterateOT([...outstandingOp], syncOp)
    }
    if (bufferOp.length > 0){
      //change syncOp inplace
      //console.log('buffer not empty')
      bufferOp = this.operation.iterateOT(bufferOp, syncOp)
    }
    this.operation.bufferOp = bufferOp
    this.operation.outstandingOp = outstandingOp
    this.applyOperation(syncOp)
  }
  applyOperation(operation){
    console.log('APPLY OP:', operation)
    let doc = this.editor.textarea.value
    for (const op of operation){
      switch (op.type) {
        case OP_TYPE.INSERT :
          doc = doc.substring(0, op.position) + op.key + doc.substring(op.position, doc.length)
          break;
        case OP_TYPE.DELETE :
          doc = doc.substring(0, op.position + op.count) + doc.substring(op.position, doc.length)
          break;
      }
      this.editor.renderEditor(doc)
    }
  }
  moveFile(id, targetID, isFirst) {
    let node = this.fileSystem.nodeMap[id]
    let targetNode = this.fileSystem.nodeMap[targetID]
    console.log('id', id, 'targetid', targetID)
    if (targetID === null){
      targetID = this.fileSystem.head.id
      targetNode = this.fileSystem.nodeMap[targetID]
      console.log('target', targetNode)
    } else{
      if(targetNode.parent.id == node.id){
        return null
      }
    }
    const element = domMap[id].cloneNode(true)
    domMap[id].remove()
    domMap[id] = element
    if (isFirst){
      const type = targetNode.type
      if(type == DATA_TYPE.FOLDER){
        this.fileSystem.moveUnderAsFirstChild(node, targetNode)
      } else if (type == DATA_TYPE.VAULT){
        console.log('target!!!', targetID)
        console.log(targetNode)
        this.fileSystem.moveUnder(node, targetNode)
      } else {
        this.fileSystem.moveAfter(node, targetNode)
      }
    }
    let paddingLeft = node.depth*15
    if(node.type == DATA_TYPE.FILE){
      paddingLeft += 5
    }
    element.style.paddingLeft= `${paddingLeft}px`
    if (targetNode.id == this.fileSystem.head.id && isFirst){
      this.panel.noteList.append(element)
    } else{
      const prevElem = domMap[targetID]
      this.insertAfter(element, prevElem)
    }
    this.fileSystem.printTree()
    if (node.firstChild !== null){
      this.moveFile(node.firstChild.id, node.id, false)
    } else if (node.next !== null && !isFirst){
      this.moveFile(node.next.id, node.id, false)
    }
    return element
    //this.fileSystem.printTree()
  }

  insertAfter(e, prev) { 
    if(prev.nextElementSibling !== null){
      this.panel.noteList.insertBefore(e, prev.nextElementSibling)
    } else {
      this.panel.noteList.append(e)
    }
  }

}

export default AppController