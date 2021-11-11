const folderOption = getElement('#folder-option')
const fileOption = getElement('#file-option')
const searchBox = getElement('#search-box')
const noteList = getElement('.note-list')
const options = getElement('.options')
const tools = getElement('.tools')
let dragTarget = null
// function bindClickNoteList(showHiddenFiles, titleChangeHandler, titleChangeOnNewElem, checkIsDuplicate, changeSelectedFile, moveFileHandler) {
//   handleNoteListFocus(titleChangeOnNewElem, checkIsDuplicate, changeSelectedFile)
//   handleNoteListClick(showHiddenFiles, titleChangeHandler, checkIsDuplicate, changeSelectedFile)
//   handleNoteListDragEvent(moveFileHandler, showHiddenFiles)
// }
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
// function changeFolderIcon(isOpen){


// }
// function handleNoteListFocus(titleChangeOnNewElem, checkIsDuplicate, changeSelectedFile) {
//     noteList.addEventListener('focusin', (e) => {
//       if(e.target.matches('#new')){
//         const p = e.target
//         p.addEventListener('blur', async () => {
//           p.innerText = p.innerText.trim()
//           p.style['pointer-events'] = 'none'
//           p.setAttribute("contenteditable", false)
//           if (p.innerText.length === 0 || (/^\s+$/).test(p.innerText)){
//             p.parentNode.remove()
//             toggleOptionFunctionality(true)
//             changeSelectedFile(null)
//             return
//           } else {
//             if(checkIsDuplicate(p.innerText, p.dataset.parent, p.parentNode.dataset.type, true)){
//               alert('There\'s already a file with the same name')
//               p.parentNode.remove()
//               toggleOptionFunctionality(true)
//               return
//             }
//             p.removeAttribute('id')
//             await titleChangeOnNewElem(p.parentNode, p.innerText, p.parentNode.dataset.type, p.dataset.parent, p.dataset.prev)
//           }
//           toggleOptionFunctionality(true)
//         }, {once: true})
//       }
//     })
//   }
 function handleNoteListClick(showHiddenFiles, titleChangeHandler, checkIsDuplicate, changeSelectedFile) {
    noteList.addEventListener('click',(event) => {
      const target = event.target
      if (!target.matches('.file') && !target.matches('.folder'))
        return
        if (event.detail === 1){
            if (target.matches('.folder.opened')){
              target.classList.toggle('opened', false)
              target.classList.toggle('closed', true)
              showHiddenFiles(target.dataset.id, true, true)
            } else if (target.matches('.folder.closed')) {
              target.classList.toggle('closed', false)
              target.classList.toggle('opened', true)
              showHiddenFiles(target.dataset.id, false, true)
            } else if (target.matches('.file')) {
              target.classList.toggle('selected', true)
              changeSelectedFile(target)
            }
          } else if (event.detail === 2){
            const p = getElement('p', target)
            selectedElementName = p.innerText
            p.style['pointer-events'] = 'auto'
            p.setAttribute("contenteditable", true);
            p.addEventListener('blur', (e) => {
              p.innerText = p.innerText.trim()
              console.log(p.innerText.trim())
              p.style['pointer-events'] = 'none'
              p.setAttribute("contenteditable", false)
              if (p.innerText.length === 0 || (/^\s+$/).test(p.innerText)){
                  p.innerText = selectedElementName
              } else {
                if (checkIsDuplicate(p.innerText, null, p.parentNode.dataset.type, false, p.parentNode.dataset.id)) {
                  alert('There\'s already a file with the same name')
                  p.innerText = selectedElementName
                } else{
                  titleChangeHandler(target.dataset.id, p.innerText)
                }  
              }
            })
        }
      noteList.addEventListener('keypress', (event) => {
        if (event.target.matches('p')){
          if (event.keyCode === 13)
            event.target.blur()
        }
      }) 
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
  console.log(id, prevID)
  let element, p
  let paddingLeft = depth*15
  if(type === DATA_TYPE.FOLDER){
    element = createElement('li', ['folder', 'opened', 'draggable'])
    element.innerHTML = `<i class="fas fa-sort-down sort-down-icon"></i>`
    p = createElement('p', ['folder-title'])
    element.setAttribute('draggable', true)
    element.dataset.type = DATA_TYPE.FOLDER
  } else {
    paddingLeft += 5
    element = createElement('li', ['file', 'selected', 'draggable'])
    element.setAttribute('draggable', true)
    p = createElement('p', ['file-title'])

    element.dataset.type = DATA_TYPE.FILE
  }
  element.dataset.id = id
  element.style.paddingLeft= `${paddingLeft}px`
  p.innerText = 'Untitled'
  element.appendChild(p)
  const prevDom = domMap[prevID]
  if(prevDom){
    noteList.insertBefore(element, prevDom.nextSibling)
  } else{
    noteList.appendChild(element)
  }
  p.setAttribute("contenteditable", true)
  p.setAttribute("id", "new")
  p.focus()
  return element
}
  // function createNewFolder(prevID) {
  //   const folder = createElement('li', ['folder', 'opened', 'draggable'])
  //   folder.innerHTML = `<i class="fas fa-sort-down sort-down-icon"></i>`
  //   const p = createElement('p', ['folder-title'])
  //   // p.dataset.placeholder = 'Untitled'
  //   p.dataset.parent = parentID
  //   p.dataset.prev = prevDom !== null? prevDom.dataset.id: null
  //   folder.appendChild(p)
  //   folder.setAttribute('draggable', true)
  //   if (prevDom !== null){
  //     noteList.insertBefore(folder, prevDom.nextSibling)
  //   } else{
  //     noteList.appendChild(folder)
  //   }
  //   toggleOptionFunctionality(false)
  //   p.setAttribute("contenteditable", true)
  //   p.setAttribute("id", "new")
  //   p.focus()
  //   return folder
  // }
  // function createNewFile(prevDom, parentID) {
  //   const file = createElement('li', ['file', 'selected', 'draggable'])
  //   const p = createElement('p', ['file-title'])
  //   p.dataset.parent = parentID
  //   p.dataset.prev = prevDom !== null? prevDom.dataset.id: null
  //   file.appendChild(p)
  //   file.setAttribute('draggable', true)
  //   if (prevDom !== null){
  //     noteList.insertBefore(file, prevDom.nextSibling)
  //   } else{
  //     noteList.appendChild(file)
  //   }
  //   toggleOptionFunctionality(false)
  //   p.setAttribute("contenteditable", true)
  //   p.setAttribute("id", "new")
  //   p.focus()
  //   return file
  // }

function buildFolder(id, name) {
  const folder = createElement('li', ['folder', 'opened', 'draggable'])
  folder.dataset.id = id
  folder.setAttribute('draggable', true)
  folder.innerHTML = `<i class="fas fa-sort-down sort-down-icon"></i>
                        <p class="folder-title" contenteditable="false" dataset-placehoder="Untitled">${name}</p>`
  noteList.appendChild(folder)
  return folder
}

function buildFile(id, name) {
  const file = createElement('li', ['file', 'draggable'])
  file.dataset.id = id
  file.setAttribute('draggable', true)
  file.innerHTML = `<p class="file-title" dataset-placehoder="Untitled" contenteditable="false">${name}</p>`
  noteList.appendChild(file) 
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
  folderOption.style.display=''
  fileOption.style.display=''
})
searchTool.addEventListener('click', (event) => {
  searchTool.classList.toggle('clicked', true)
  navigationTool.classList.toggle('clicked', false)
  searchBox.classList.toggle('hidden', false)
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
    e.target.classList.add('entered')
    dragTarget = e.target
  }
  console.log(dragTarget)
})
document.addEventListener('dragleave', (e) => {
  if(e.target.matches('.dragging')){
    return
  } else if (e.target.matches('.folder') || e.target.matches('.file')){
    e.target.classList.remove('entered')
  } else if (e.target.matches('.note-list')){
    dragTarget = noteList
  } else{
     dragTarget = null
  }
})




