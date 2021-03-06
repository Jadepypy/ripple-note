const folderOption = getElement('#folder-option')
const fileOption = getElement('#file-option')
const searchBox = getElement('#search-box')
const noteList = getElement('.note-list')
const searchList = getElement('.search-list')
const options = getElement('.options')
const tools = getElement('.tools')
let dragTarget = null

function handleNoteListDragEvent(moveFileHandler, showHiddenFiles) {
  noteList.addEventListener('dragstart', (e) => {
    e.target.classList.add("dragging");      
  })
  noteList.addEventListener('dragenter', (e) => {
    if(e.target.matches('.dragging')){
      return
    } else if (e.target.matches('.folder') || e.target.matches('.file')){
      e.target.classList.add('entered')
      target = e.target
    }
  })
  document.addEventListener('dragleave', (e) => {
    if(e.target.matches('.dragging')){
      return
    } else if (e.target.matches('.folder') || e.target.matches('.file')){
      e.target.classList.remove('entered')
    } else if (e.target.matches('.note-list')){
      target = noteList
    } else {
      target = null
    }
  })
  noteList.addEventListener('dragend', (e) => {
    e.target.classList.remove('dragging')
    if (target !== null){
      if (target.matches('.note-list')){
        moveFileHandler(e.target.dataset.id, null, true)
        return
      }
      const element = moveFileHandler(e.target.dataset.id, target.dataset.id, true)
      if(element === null){
        return
      }
      if(target.matches('.folder.opened')&& e.target.matches('.folder.closed')){
        e.target.style.display = ''
        showHiddenFiles(e.target.dataset.id, false, true)
      } else if(target.matches('.folder.closed')&& e.target.matches('.folder.opened')) {
        element.style.display = 'none'
        element.classList.remove('opened')
        element.classList.add('closed')
        // console.log('current', e.target)
        showHiddenFiles(e.target.dataset.id, true, true)
      }
    }
    target = null
  })
}
function bindClickFolderOptions(newFolderhandler){
  folderOption.addEventListener('click', () => {
    newFolderhandler()
  })
}
function bindClickFileOptions(newFilehandler){
  fileOption.addEventListener('click', () => {
    newFilehandler()
  })
}

function renderPanel() {

}
function createFolderOrFile(type, id, prevID, depth) {
  //console.log(id, prevID)
  let element, p
  let paddingLeft = depth*15
  const div = createElement('div', ['dropdown','remove-icon-container'])
  div.innerHTML = `
    <button class="btn mx-0 shadow-none" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
      <i class="fas fa-ellipsis-v" id="dot-icon"></i></button>`
  if(type === DATA_TYPE.FOLDER){
    element = createElement('li', ['folder', 'opened', 'draggable'])
    element.innerHTML = `<i class="fas fa-sort-down sort-down-icon"></i>`
    p = createElement('p', ['folder-title'])
    element.setAttribute('draggable', true)
    element.dataset.type = DATA_TYPE.FOLDER
    div.innerHTML += `<ul class="dropdown-menu" aria-labelledby="dropdownMenuButton" data-id="${id}">
    <li><a class="dropdown-item" id="remove-btn">Remove</a></li>
    <li><a class="dropdown-item" id="rename-btn">Rename</a></li>
    <li><a class="dropdown-item" id="new-note">New Note</a></li>
    <li><a class="dropdown-item" id="new-folder">New Folder</a></li>
  </ul>`
  } else {
    paddingLeft += 5
    element = createElement('li', ['file', 'draggable'])
    element.setAttribute('draggable', true)
    p = createElement('p', ['file-title'])

    element.dataset.type = DATA_TYPE.FILE
    div.innerHTML += `<ul class="dropdown-menu" aria-labelledby="dropdownMenuButton" data-id="${id}">
    <li><a class="dropdown-item" id="remove-btn">Remove</a></li>
    <li><a class="dropdown-item" id="rename-btn">Rename</a></li></ul>`
  }
  element.dataset.id = id
  element.style.paddingLeft= `${paddingLeft}px`
  p.innerText = 'Untitled'
  element.appendChild(p)
  element.appendChild(div)
  const prevDom = domMap[prevID]
  if(prevDom){
    noteList.insertBefore(element, prevDom.nextSibling)
  } else{
    noteList.appendChild(element)
  }
  p.setAttribute("contenteditable", true)
  p.setAttribute("id", "new")
  //p.focus()
  return element
}

function buildFolder(id, name) {
  const folder = createElement('li', ['folder', 'opened', 'draggable'])
  folder.dataset.id = id
  folder.setAttribute('draggable', true)
  folder.innerHTML = `<i class="fas fa-sort-down sort-down-icon"></i>
                        <p class="folder-title" contenteditable="false" dataset-placehoder="Untitled">${name}</p>
                        <div class="remove-icon-container btn-group dropend">
                        <button class="btn mx-0 px-0 shadow-none" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                          <i class="fas fa-ellipsis-v" id="dot-icon"></i>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton" data-id="${id}">
                          <li><a class="dropdown-item" id="remove-btn">Remove</a></li>
                          <li><a class="dropdown-item" id="rename-btn">Rename</a></li>
                          <li><a class="dropdown-item" id="new-note">New Note</a></li>
                          <li><a class="dropdown-item" id="new-folder">New Folder</a></li>
                        </ul>
                        </div>`
  noteList.appendChild(folder)
  return folder
}

function buildFile(id, name) {
  const file = createElement('li', ['file', 'draggable'])
  file.dataset.id = id
  file.setAttribute('draggable', true)
  file.innerHTML = `<p class="file-title" dataset-placehoder="Untitled" contenteditable="false">${name}</p>
                    <div class="remove-icon-container dropdown dropstart">
                      <button class="btn mx-0 px-0 shadow-none" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-ellipsis-v" id="dot-icon"></i>
                      </button>
                      <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton" data-id="${id}">
                        <li><a class="dropdown-item" id="remove-btn">Remove</a></li>
                        <li><a class="dropdown-item" id="rename-btn">Rename</a></li>
                      </ul>
                    </div>`
  noteList.appendChild(file) 
  return file 
}
function buildSearchFile(id, name) {
  const file = createElement('li', ['file', 'search-result'])
  file.dataset.id = id
  file.innerHTML = `<p class="file-title" dataset-placehoder="Untitled" contenteditable="false">${name}</p>`
  searchList.appendChild(file) 
  return file 
}

function toggleOptionFunctionality(isOn) {
  if (isOn) {
    folderOption.classList.toggle('disabled', false)
    fileOption.classList.toggle('disabled', false)
  } else {
    folderOption.classList.toggle('disabled', true)
    fileOption.classList.toggle('disabled', true)
  }
}

//add event listeners without need of controller funcitons
navigationTool.addEventListener('click', () => {
  navigationTool.classList.toggle('clicked', true)
  searchTool.classList.toggle('clicked', false)
  searchBox.classList.toggle('hidden', true)
  searchList.classList.toggle('hidden', true)
  noteList.classList.toggle('hidden', false)
  folderOption.style.display=''
  fileOption.style.display=''
})
searchTool.addEventListener('click', (event) => {
  searchTool.classList.toggle('clicked', true)
  navigationTool.classList.toggle('clicked', false)
  searchBox.classList.toggle('hidden', false)
  searchList.classList.toggle('hidden', false)
  noteList.classList.toggle('hidden', true)
  folderOption.style.display='none'
  fileOption.style.display='none'
})
noteList.addEventListener('keypress', (event) => {
  if (event.target.matches('p')){
    if (event.keyCode === 13){
      event.preventDefault()
      event.target.blur() 
    }
  }
}) 
noteList.addEventListener('dragstart', (e) => {
  e.target.classList.add("dragging");     
})
noteList.addEventListener('dragenter', (e) => {
  if(e.target.matches('.dragging')){
    return
  } else if (e.target.matches('.folder') || e.target.matches('.file')){
    dragTarget = e.target
    //console.log(dragTarget)
    e.target.classList.add('entered')
  }
})

noteList.addEventListener('dragover', (event) => {
  const element = getDragAfterElement(event.clientY)
  if(element){
    dragTarget = element
  }
})
function getDragAfterElement(y) {
  const draggableElements = [...noteList.querySelectorAll('.draggable:not(.dragging)')]
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect()
    const offset = y - box.top - box.height / 2
    if (offset > 0 && offset < closest.offset && offset < box.height) {
      return { offset: offset, element: child }
    } else {
      return closest
    }
  }, {offset: Number.POSITIVE_INFINITY}).element
}
document.addEventListener('dragleave', (e) => {
  if(e.target.matches('.dragging')){
    return
  } else if (e.target.matches('.folder') || e.target.matches('.file')){
    e.target.classList.remove('entered')
  } else if (e.target.matches('.note-list')){
    dragTarget = noteList
  }
})







