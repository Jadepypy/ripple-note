// import BaseView from "./base_view.js"
// import {backlink, config} from "../utils/utils.js"
const noteTitle = getElement('#note-title')
const textarea = getElement('#note')
const trash = getElement('#trash-icon')
const editor = getElement('.editor')
const reminder = getElement('.reminder')
const preview = getElement('#preview-icon')
const previewWindow = document.querySelector('#preview-window')

function renderEditor(content, name) {
  if (name){
    noteTitle.value = name
  }
  textarea.value = content
}

function showEditor(fileIsOpen) {
  if(fileIsOpen){
    toggleEditorDisplay(false)
    editor.classList.toggle('hidden', false)
    reminder.classList.toggle('hidden', true)
  } else{
    editor.classList.toggle('hidden', true)
    reminder.classList.toggle('hidden', false)
  }
}

function convertHtmlToMD() {
  const html = DOMPurify.sanitize(marked(textarea.value), config)
  previewWindow.innerHTML = html
}

function toggleEditorDisplay(isOn){
  if(isOn){
    preview.classList.remove('fa-align-right')
    preview.classList.add('fa-edit')
    textarea.classList.toggle('hidden', true)
    previewWindow.classList.toggle('hidden', false)
  } else{
    preview.classList.add('fa-align-right')
    preview.classList.remove('fa-edit')
    textarea.classList.toggle('hidden', false)
    previewWindow.classList.toggle('hidden', true)
  }
}

//add event listeners without need of controller funcitons
preview.addEventListener('click', () => {
  if (preview.matches('.fa-align-right')){
    toggleEditorDisplay(true)
    convertHtmlToMD()
  } else{
    toggleEditorDisplay(false)
  }
})

