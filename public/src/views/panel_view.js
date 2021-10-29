import BaseView from "./base_view.js"

class PanelView extends BaseView {
  constructor () {
    super()
    this.folderOption = this.getElement('#folder-option')
    this.fileOption = this.getElement('#file-option')
    this.searchBox = this.getElement('#search-box')
    this.noteList = this.getElement('.note-list')

  }

  bindClickPanelTools(handler) {
    this.navigationTool.addEventListener('click', () => {
      this.navigationTool.classList.toggle('clicked', true)
      this.searchTool.classList.toggle('clicked', false)
      this.searchBox.classList.toggle('hidden', true)
      this.folderOption.style.display=''
      this.fileOption.style.display=''
      handler(this.navigationTool.dataset.mode)
    })
    this.searchTool.addEventListener('click', (event) => {
      this.searchTool.classList.toggle('clicked', true)
      this.navigationTool.classList.toggle('clicked', false)
      this.searchBox.classList.toggle('hidden', false)
      this.folderOption.style.display='none'
      this.fileOption.style.display='none'
      handler(this.searchTool.dataset.mode)
    })
  }

  bindClickNoteList(showHiddenFiles, titleChangeHandler, changeSelectedFile) {
    this.noteList.addEventListener('click',(event) => {
      const target = event.target
      if (!target.matches('.file') && !target.matches('.folder'))
        return
      if (event.detail === 1){
        if (target.matches('.folder.opened')){
          target.classList.toggle('opened', false)
          target.classList.toggle('closed', true)
        } else if (target.matches('.folder.closed')) {
          target.classList.toggle('closed', false)
          target.classList.toggle('opened', true)
          showHiddenFiles(target)
        } else if (target.matches('.file')) {
          target.classList.toggle('selected', true)
          changeSelectedFile(target)
        }
      } else if (event.detail === 2){
        const p = this.getElement('p', target)
        p.style['pointer-events'] = 'auto'
        p.setAttribute("contenteditable", true);
        p.addEventListener('blur', (e) => {
          p.style['pointer-events'] = 'none'
          p.setAttribute("contenteditable", false);
          titleChangeHandler(target.dataset.type, p.innerText)
        })
      }
      this.noteList.addEventListener('keypress', (event) => {
        if (event.target.matches('p')){
          if (event.keyCode === 13)
            event.preventDefault()
        }
      }) 
    })
  }
  bindClickFolderOptions(newFolderhandler){
    this.folderOption.addEventListener('click', () => {
      this.createFolder(newFolderhandler)
    })
  }
  bindClickFileOptions(newFilehandler){
    this.fileOption.addEventListener('click', () => {
      this.createFile(newFilehandler)
    })
  }

  renderPanel() {

  }

  createFolder(newFolderhandler) {
    const folder = this.createElement('li', ['folder', 'closed'])
    const untitledCount = newFolderhandler(folder)
    folder.innerHTML = `<i class="fas fa-sort-down sort-down-icon"></i>
                          <p class="folder-title" contenteditable="false">Untitled${untitledCount}</p>`
    this.noteList.appendChild(folder)

  }

  createFile(newFileHandlor) {
    const file = this.createElement('li', ['file', 'selected'])
    const untitledCount = newFileHandlor(file)
    file.innerHTML = `<p class="file-title" contenteditable="false">Untitled${untitledCount}</p>`
    this.noteList.appendChild(file)  
  }


}

export default PanelView