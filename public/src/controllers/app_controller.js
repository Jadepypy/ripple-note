class AppController {
  constructor (noteModel, fileSystemModel, sidebarView, panelView, editorView){
    this.noteModel = noteModel
    this.fileSystemModel = fileSystemModel
    this.sidebarView = sidebarView
    this.panelView = panelView
    this.editorView = editorView

    // this.sidebarView.bindClickArrow(this.togglePanelDisplay())
    // this.panelView.bindClickNavigation(this.changePanelToNavigation())
    // this.panelView.bindClickSearch(this.changePanelToSearch())
  }
  init() {
    console.log('start')
  }

  changePanelTonavigation() {
    
  }



}

export default AppController