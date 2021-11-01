class PanelModel {
  constructor () {
    this.file = null
    this.displayNavigationFiles = []
    this.navigationFileSystem = []
    this.searchFileSystem = []
    this.PANEL_MODE = {
      NAVIGATION: 0,
      SEARCH: 1
    }
    this.PANEL_STATE = {
      EXPAND: 0,
      COLLAPSED: 1
    }
    this.panelState = this.PANEL_STATE.EXPAND
    this.currentMode = this.PANEL_MODE.NAVIGATION
    this.keyword = undefined
  }
  addNavigationFolder (folder){
    this.navigationFolders.push(folder)
  }
  addNavigationFile (file){
    this.navigationFiles.push(file)
  }
}
export default PanelModel