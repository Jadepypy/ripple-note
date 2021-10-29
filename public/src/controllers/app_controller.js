class AppController {
  constructor (noteModel, fileSystemModel, sidebarView, panelView, editorView){
    this.noteModel = noteModel
    this.fileSystemModel = fileSystemModel
    this.sidebarView = sidebarView
    this.panelView = panelView
    this.editorView = editorView

    this.sidebarView.bindClickArrow(this.changePanelState.bind(this))
    this.panelView.bindClickPanelTools(this.changePanelTool.bind(this))
    this.panelView.bindClickNoteList(this.showHiddenFiles.bind(this), this.changeTitle.bind(this), this.changeSelectedFile.bind(this))
    
    
    this.panelView.bindClickFolderOptions(this.createFolder.bind(this))
    this.panelView.bindClickFileOptions(this.createFile.bind(this))


  }
  init() {
    console.log('start')
  }
  changePanelState (state) {
    this.fileSystemModel.panelState = this.fileSystemModel.PANEL_STATE[state]
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
  changeTitle (dataType, title) {
    console.log(dataType, title)

  }
  changeSelectedFile(file) {
    if (this.fileSystemModel.file !== null){
      this.panelView.toggleTag(this.fileSystemModel.file, 'selected', false)
    }
    this.fileSystemModel.file = file
  }

  createFolder(folder) {
    folder.dataset.type = this.fileSystemModel.DATA_TYPE.FOLDER
    //add folder to model filesystem return untitled Count
    const untitledCount = 1
    return untitledCount
  }

  createFile(file) {
    file.dataset.type = this.fileSystemModel.DATA_TYPE.FILE
    if (this.fileSystemModel.file !== null){
      this.panelView.toggleTag(this.fileSystemModel.file, 'selected', false)
    }
    //add file to model filesystem
    const untitledCount = 1
    this.fileSystemModel.file = file
    console.log('add', this.fileSystemModel.file)
    return untitledCount
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