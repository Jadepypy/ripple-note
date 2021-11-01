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

  bindClickNoteList(showHiddenFiles, titleChangeHandler, titleChangeOnNewElem, checkIsDuplicate, changeSelectedFile) {
    this.handleNoteListFocus(titleChangeOnNewElem, checkIsDuplicate)
    this.handleNoteListClick(showHiddenFiles, titleChangeHandler, checkIsDuplicate, changeSelectedFile)
  }
  handleNoteListFocus(titleChangeOnNewElem, checkIsDuplicate) {
    this.noteList.addEventListener('focusin', (e) => {
      if(e.target.matches('#new')){
        const p = e.target
        p.addEventListener('blur', async () => {
          p.innerText = p.innerText.trim()
          p.style['pointer-events'] = 'none'
          p.setAttribute("contenteditable", false)
          if (p.innerText.length === 0 || (/^\s+$/).test(p.innerText)){
            p.parentNode.remove()
            this.toggleOptionFunctionality(true)
            return
          } else {
            if(checkIsDuplicate(p.innerText, p.dataset.parent, p.parentNode.dataset.type, true)){
              alert('There\'s already a file with the same name')
              p.parentNode.remove()
              this.toggleOptionFunctionality(true)
              return
            }
            p.removeAttribute('id')
            await titleChangeOnNewElem(p.parentNode, p.innerText, p.parentNode.dataset.type, p.dataset.parent, p.dataset.prev)
          }
          this.toggleOptionFunctionality(true)
        }, {once: true})
      }
    })
  }
  handleNoteListClick(showHiddenFiles, titleChangeHandler, checkIsDuplicate, changeSelectedFile) {
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
            this.selectedElementName = p.innerText
            p.style['pointer-events'] = 'auto'
            p.setAttribute("contenteditable", true);
            p.addEventListener('blur', (e) => {
              p.innerText = p.innerText.trim()
              console.log(p.innerText.trim())
              p.style['pointer-events'] = 'none'
              p.setAttribute("contenteditable", false)
              if (p.innerText.length === 0 || (/^\s+$/).test(p.innerText)){
                  p.innerText = this.selectedElementName
              } else {
                if (checkIsDuplicate(p.innerText, null, p.parentNode.dataset.type, false, p.parentNode.dataset.id)) {
                  alert('There\'s already a file with the same name')
                  p.innerText = this.selectedElementName
                } else{
                  titleChangeHandler(target.dataset.id, p.innerText)
                }  
              }
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
      newFolderhandler()
    })
  }
  bindClickFileOptions(newFilehandler){
    this.fileOption.addEventListener('click', () => {
      newFilehandler()
    })
  }

  renderPanel() {

  }
  createNewFolder(prevDom, parentID) {
    const folder = this.createElement('li', ['folder', 'closed'])
    folder.innerHTML = `<i class="fas fa-sort-down sort-down-icon"></i>`
    const p = this.createElement('p', ['folder-title'])
    // p.dataset.placeholder = 'Untitled'
    p.dataset.parent = parentID
    p.dataset.prev = prevDom !== null? prevDom.dataset.id: null
    folder.appendChild(p)
    if (prevDom !== null){
      this.noteList.insertBefore(folder, prevDom.nextSibling)
    } else{
      this.noteList.appendChild(folder)
    }
    this.toggleOptionFunctionality(false)
    p.setAttribute("contenteditable", true)
    p.setAttribute("id", "new")
    p.focus()
    return folder
  }
  createNewFile(prevDom, parentID) {
    const file = this.createElement('li', ['file', 'selected'])
    const p = this.createElement('p', ['file-title'])
    p.dataset.parent = parentID
    p.dataset.prev = prevDom !== null? prevDom.dataset.id: null
    file.appendChild(p)
    if (prevDom !== null){
      this.noteList.insertBefore(file, prevDom.nextSibling)
    } else{
      this.noteList.appendChild(file)
    }
    this.toggleOptionFunctionality(false)
    p.setAttribute("contenteditable", true)
    p.setAttribute("id", "new")
    p.focus()
    return file
  }

  buildFolder(id, name) {
    const folder = this.createElement('li', ['folder', 'closed'])
    folder.dataset.id = id
    folder.innerHTML = `<i class="fas fa-sort-down sort-down-icon"></i>
                          <p class="folder-title" contenteditable="false" dataset-placehoder="Untitled">${name}</p>`
    this.noteList.appendChild(folder)
    return folder
  }

  buildFile(id, name) {
    const file = this.createElement('li', ['file'])
    file.dataset.id = id
    file.innerHTML = `<p class="file-title" dataset-placehoder="Untitled" contenteditable="false">${name}</p>`
    this.noteList.appendChild(file) 
    return file 
  }

  toggleOptionFunctionality(isOn) {
    if (isOn) {
      this.folderOption.classList.toggle('disabled', false)
      this.fileOption.classList.toggle('disabled', false)
    } else {
      this.folderOption.classList.toggle('disabled', true)
      this.fileOption.classList.toggle('disabled', true)
    }
  }


}

export default PanelView