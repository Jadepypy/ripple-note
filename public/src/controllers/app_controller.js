import {Node} from '../utils/utils.js'
import {STATE, OP_TYPE} from '../utils/enum.js'

class AppController {
  constructor (operationModel, fileSystemModel, panelModel, sidebarView, panelView, editorView, socketIO, api){
    this.operationModel = operationModel
    this.fileSystemModel = fileSystemModel
    this.panelModel = panelModel
    this.sidebarView = sidebarView
    this.panelView = panelView
    this.editorView = editorView
    this.socketIO = socketIO
    this.api = api

    this.sidebarView.bindClickArrow(this.changePanelState.bind(this))
    this.panelView.bindClickPanelTools(this.changePanelTool.bind(this))
    this.panelView.bindClickNoteList(this.showHiddenFiles.bind(this), this.changeTitle.bind(this), this.addTitleToNewElement.bind(this), this.checkIsDuplicate.bind(this), this.changeSelectedFile.bind(this), this.moveFile.bind(this))
    this.panelView.bindClickFolderOptions(this.createNewElement(this.fileSystemModel.DATA_TYPE.FOLDER))
    this.panelView.bindClickFileOptions(this.createNewElement(this.fileSystemModel.DATA_TYPE.FILE))

    this.editorView.bindTrashIcon(this.changeSelectedFile.bind(this))
    this.editorView.bindTextAreaEdit(this.handleTextAreaOperation.bind(this))
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
    this.fileSystemModel.buildTree(nodeMap[rootID], nodeMap, this.buildFileOrFolder.bind(this))
    // this.fileSystemModel.printTree()

  }
  createNewElement(type) {
    return async () => {
      console.log(this.fileSystemModel.file)
      const vaultID = this.fileSystemModel.head.id
      const [prevDom, prevNode, parent] = this.fileSystemModel.getDataBeforeInsertion()
      // console.log('prevDom', prevDom, prevNode)
      let element, name, isRemoved
      if(type === this.fileSystemModel.DATA_TYPE.FOLDER){
        element = this.panelView.createNewFolder(prevDom, parent.id)
        element.dataset.type = this.fileSystemModel.DATA_TYPE.FOLDER
      }
      else if (type === this.fileSystemModel.DATA_TYPE.FILE){
        element = this.panelView.createNewFile(prevDom, parent.id)
        element.dataset.type = this.fileSystemModel.DATA_TYPE.FILE
        this.changeSelectedFile(element)
      }
    }
  }
  buildFileOrFolder(id, name, type, depth) {
    if (type == this.fileSystemModel.DATA_TYPE.FOLDER){
      const folder =  this.panelView.buildFolder(id, name)
      folder.dataset.type = this.fileSystemModel.DATA_TYPE.FOLDER
      const node = this.fileSystemModel.nodeMap
      const paddingLeft = depth*15
      folder.style.paddingLeft= `${paddingLeft}px`
      return folder
    } else {
      const file = this.panelView.buildFile(id, name)
      const paddingLeft = depth*15 + 5
      file.style.paddingLeft= `${paddingLeft}px`
      file.dataset.type = this.fileSystemModel.DATA_TYPE.FILE
      return file
    }
  }

  checkIsDuplicate(name, parentID, type, isNew, id) {
    // console.log('Node', id)
    let parent
    if (isNew){
      parent = this.fileSystemModel.nodeMap[parentID]
    } else{
      const node = this.fileSystemModel.nodeMap[id]
      if (node.name == name){
        return
      }
      parent = this.fileSystemModel.nodeMap[id].parent
    }
    const duplicateID = this.fileSystemModel.getDuplicateElementID(name, parent.firstChild, type, null)
    if (duplicateID !== null){
      if (isNew){
        this.changeSelectedFile(this.fileSystemModel.domMap[duplicateID])
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
    const element = this.fileSystemModel.domMap[id]
    console.log(element)
    const node = this.fileSystemModel.nodeMap[id]
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
    //this.fileSystemModel.printTree()
  }
  async addTitleToNewElement(element, name, type, parentID, prevID) {
    // console.log('name', name)
    const id = await this.api.getElementID(this.fileSystemModel.head.id, parentID, name, type)
    const node = new Node(id, null, null, type, name)
    this.fileSystemModel.nodeMap[id] = node
    this.fileSystemModel.domMap[id] = element
    element.dataset.id = id
    if (prevID !== String(null)){
      const prevNode = this.fileSystemModel.nodeMap[prevID]
      this.fileSystemModel.insertAfter(node, prevNode)
    } else{
      const parent = this.fileSystemModel.nodeMap[parentID]
      this.fileSystemModel.insertUnder(node, parent)
    }
    if (type == this.fileSystemModel.DATA_TYPE.FILE){
      this.changeSelectedFile(element)
    }
    // this.fileSystemModel.printTree()
  }
  changeTitle (id, name) {
    const node = this.fileSystemModel.nodeMap[id]
    node.name = name
    // this.fileSystemModel.printTree()
  }
  
  changeSelectedFile(file) {
    if (this.fileSystemModel.file !== null){
      this.panelView.toggleTag(this.fileSystemModel.file, 'selected', false)
    }
    this.fileSystemModel.file = file
    if (file === null){
      return
    } else {
      this.editorView.showEditor(true)
    }
    this.panelView.toggleTag(file, 'selected', true)
    // console.log(file.dataset.id)
    this.socketIO.joinNote(file.dataset.id)
    this.operationModel.id = file.dataset.id
    this.operationModel.name = file.children[file.children.length - 1].innerText
  }
  initializeNote(revisionID, doc) {
    this.operationModel.revisionID = revisionID
    this.operationModel.doc = doc
    // console.log(this.operationModel.name, doc)
    this.editorView.renderEditor(doc, this.operationModel.name)
  }

  handleTextAreaOperation(opInfo){
    let state = this.operationModel.state
    const outstandingOp = this.operationModel.outstandingOp
    const bufferOp = this.operationModel.bufferOp
    const revisionID = this.operationModel.revisionID
    if (state === STATE.CLEAR){
      outstandingOp.push(...opInfo)
      this.socketIO.sendOperation(revisionID, outstandingOp)
      this.operationModel.state = STATE.WAITING
    } else {
      bufferOp.push(...opInfo)
    }
    // console.log(outstandingOp)
  }

  handleAcknowledgement(revisionID) {
    this.operationModel.revisionID = revisionID
    this.operationModel.state = STATE.CLEAR
    let bufferOp = this.operationModel.bufferOp
    let outstandingOp = this.operationModel.outstandingOp

    outstandingOp = []
    if (bufferOp.length > 0){
      //console.log('send operatoin')
      //console.log(bufferOp)
      this.socketIO.sendOperation(revisionID, bufferOp)
      outstandingOp = [...bufferOp]
      this.operationModel.state = STATE.WAITING
      bufferOp = []
    }
    this.operationModel.bufferOp = bufferOp
    this.operationModel.outstandingOp = outstandingOp
  }
  handleSyncOperation(revisionID, syncOp) {
    this.operationModel.revisionID = revisionID
    let outstandingOp = this.operationModel.outstandingOp
    let bufferOp = this.operationModel.bufferOp
    // console.log('GET SYNC:')
    
    // for (const op of syncOp){
    //   console.log(op)
    // }
    if (outstandingOp.length > 0){
      //change syncOp inplace
      //console.log(outstandingOp)
      this.operationModel.iterateOT([...outstandingOp], syncOp)
    }
    if (bufferOp.length > 0){
      //change syncOp inplace
      //console.log('buffer not empty')
      bufferOp = this.operationModel.iterateOT(bufferOp, syncOp)
    }
    this.operationModel.bufferOp = bufferOp
    this.operationModel.outstandingOp = outstandingOp
    this.applyOperation(syncOp)
  }
  applyOperation(operation){
    console.log('APPLY OP:', operation)
    let doc = this.editorView.textarea.value
    for (const op of operation){
      switch (op.opType) {
        case OP_TYPE.INSERT :
          doc = doc.substring(0, op.pos) + op.key + doc.substring(op.pos, doc.length)
          break;
        case OP_TYPE.DELETE :
          doc = doc.substring(0, op.pos + op.count) + doc.substring(op.pos, doc.length)
          break;
      }
      this.editorView.renderEditor(doc)
    }
  }
  moveFile(id, targetID, isFirst) {
    let node = this.fileSystemModel.nodeMap[id]
    let targetNode = this.fileSystemModel.nodeMap[targetID]
    console.log('id', id, 'targetid', targetID)
    if (targetID === null){
      targetID = this.fileSystemModel.head.id
      targetNode = this.fileSystemModel.nodeMap[targetID]
      console.log('target', targetNode)
    } else{
      if(targetNode.parent.id == node.id){
        return null
      }
    }
    const element = this.fileSystemModel.domMap[id].cloneNode(true)
    this.fileSystemModel.domMap[id].remove()
    this.fileSystemModel.domMap[id] = element
    if (isFirst){
      const type = targetNode.type
      if(type == this.fileSystemModel.DATA_TYPE.FOLDER){
        this.fileSystemModel.moveUnderAsFirstChild(node, targetNode)
      } else if (type == this.fileSystemModel.DATA_TYPE.VAULT){
        console.log('target!!!', targetID)
        console.log(targetNode)
        this.fileSystemModel.moveUnder(node, targetNode)
      } else {
        this.fileSystemModel.moveAfter(node, targetNode)
      }
    }
    let paddingLeft = node.depth*15
    if(node.type == this.fileSystemModel.DATA_TYPE.FILE){
      paddingLeft += 5
    }
    element.style.paddingLeft= `${paddingLeft}px`
    if (targetNode.id == this.fileSystemModel.head.id && isFirst){
      this.panelView.noteList.append(element)
    } else{
      const prevElem = this.fileSystemModel.domMap[targetID]
      this.insertAfter(element, prevElem)
    }
    this.fileSystemModel.printTree()
    if (node.firstChild !== null){
      this.moveFile(node.firstChild.id, node.id, false)
    } else if (node.next !== null && !isFirst){
      this.moveFile(node.next.id, node.id, false)
    }
    return element
    //this.fileSystemModel.printTree()
  }

  insertAfter(e, prev) { 
    if(prev.nextElementSibling !== null){
      this.panelView.noteList.insertBefore(e, prev.nextElementSibling)
    } else {
      this.panelView.noteList.append(e)
    }
  }

}

export default AppController