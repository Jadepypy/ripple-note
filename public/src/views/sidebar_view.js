const arrow = getElement('#arrow')
const panel =  getElement('.panel')
const editorContainer = getElement('.editor-container')  

//add event listeners without need of controller funcitons
arrow.addEventListener('click', () => {
  if (arrow.matches('.fa-angle-double-left')){
    arrow.classList.remove('fa-angle-double-left')
    arrow.classList.add('fa-angle-double-right')
    panel.style.display='none'
    editorContainer.style.gridTemplateAreas = '"main main"';
    handler(arrow.dataset.state)
  } else {
    panel.style.display=''
    arrow.classList.remove('fa-angle-double-right')
    arrow.classList.add('fa-angle-double-left')
    editorContainer.style.gridTemplateAreas = '"side main"';
  }
})



