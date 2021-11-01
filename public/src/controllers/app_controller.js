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
    this.panelView.bindClickNoteList(this.showHiddenFiles.bind(this), this.changeTitle.bind(this), this.addTitleToNewElement.bind(this), this.checkIsDuplicate.bind(this), this.changeSelectedFile.bind(this))
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

    this.socketIO.registerCallbacks(callbacks)
  }
  constructFileSystem(rootID, dataArr) {
    const nodeMap = {}
    for (const data of dataArr){
      nodeMap[data[0]] = new Node(...data)
    }
    this.fileSystemModel.buildTree(nodeMap[rootID], nodeMap, this.buildFileOrFolder.bind(this))
  }
  createNewElement(type) {
    return async () => {
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
  buildFileOrFolder(id, name, type) {
    if (type == this.fileSystemModel.DATA_TYPE.FOLDER){
      const folder =  this.panelView.buildFolder(id, name)
      folder.dataset.type = this.fileSystemModel.DATA_TYPE.FOLDER
      return folder
    } else {
      const file = this.panelView.buildFile(id, name)
      file.dataset.type = this.fileSystemModel.DATA_TYPE.FILE
      return file
    }
  }

  checkIsDuplicate(name, parentID, type, isNew, id) {
    console.log('Node', id)
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
  showHiddenFiles(folder) {
    //given folder get sub files from model
    //add files into displayfiles (may be an array)
    //use view function to insert files into notelist (render display files)
  }
  async addTitleToNewElement(element, name, type, parentID, prevID) {
    console.log('name', name)
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
    console.log(outstandingOp)
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
    console.log('GET SYNC:')
    
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
}

export default AppController