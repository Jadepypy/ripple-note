import {Node} from '../utils/utils.js'
class AppController {
  constructor (noteModel, fileSystemModel, panelModel, sidebarView, panelView, editorView, socketIO, api){
    this.noteModel = noteModel
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
  }
  init() {
    this.socketIO.init(1, 'abc')
    const callbacks = {
      fileSystem: this.constructFileSystem.bind(this),
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
      console.log('prevDom', prevDom, prevNode)
      let element, name, isRemoved
      if(type === this.fileSystemModel.DATA_TYPE.FOLDER){
        element = this.panelView.createNewFolder(prevDom, parent.id)
        element.dataset.type = this.fileSystemModel.DATA_TYPE.FOLDER
      }
      else if (type === this.fileSystemModel.DATA_TYPE.FILE){
        element = this.panelView.createNewFile(prevDom, parent.id)
        element.dataset.type = this.fileSystemModel.DATA_TYPE.FILE
        this.changeSelectedFile(element)
        // if(!isRemoved){
        //   this.changeSelectedFile(element)
        // }
      }
      // if (isRemoved){
      //   return
      // }
      // console.log('name', name)
      // const id = await this.api.getElementID(vaultID, parent.id, name, type)
      // element.dataset.id = id
      // this.panelView.toggleOptionFunctionality(true)
      // const node = new Node(id, null, null, type, name)
      // this.fileSystemModel.nodeMap[id] = node
      // this.fileSystemModel.domMap[id] = element
      // if (prevNode === null){
      //   this.fileSystemModel.insertUnder(node, parent)
      // } else{
      //   this.fileSystemModel.insertAfter(node, prevNode)
      // }
      // this.fileSystemModel.printTree()
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
    let parent
    if (isNew){
      parent = this.fileSystemModel.nodeMap[parentID]
    } else{
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


  // createFile() {
  //   file.dataset.type = this.fileSystemModel.DATA_TYPE.FILE
  //   if (this.fileSystemModel.file !== null){
  //     this.panelView.toggleTag(this.fileSystemModel.file, 'selected', false)
  //   }
  //   //add file to model filesystem
  //   const untitledCount = 1
  //   this.fileSystemModel.file = file
  //   console.log('add', this.fileSystemModel.file)
  //   return untitledCount
  // }
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
    const id = await this.api.getElementID(this.fileSystemModel.head.id, parentID, name, type)
    const node = new Node(id, null, null, type, name)
    this.fileSystemModel.nodeMap[id] = node
    this.fileSystemModel.domMap[id] = element
    if (prevID !== String(null)){
      const prevNode = this.fileSystemModel.nodeMap[prevID]
      this.fileSystemModel.insertAfter(node, prevNode)
    } else{
      this.fileSystemModel.insertUnder(node, parent)
      this.fileSystemModel.insertUnder(node, parent)
    }
    if (type == this.fileSystemModel.DATA_TYPE.FILE){
      this.changeSelectedFile(element)
    }
    this.fileSystemModel.printTree()
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
    this.panelView.toggleTag(file, 'selected', true)
    
  }




  // selectTargetFile(){

  // }
  // changeFolderName (){

  // }
  // changeFileName() {

  // }

  // createFile(){
    
  // }

  // createFolder(){

  // }



}

export default AppController