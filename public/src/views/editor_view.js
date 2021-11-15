// import BaseView from "./base_view.js"
// import {backlink, config} from "../utils/utils.js"
const noteTitle = getElement('#note-title')
const textarea = getElement('#note')
const trash = getElement('#trash-icon')
const editor = getElement('.editor')
const reminder = getElement('.reminder')
const preview = getElement('#preview-icon')
const previewWindow = document.querySelector('#preview-window')
const textAreaContainer = document.querySelector('.textarea-container')

$(window).on('load', () => {
  $('.linked').scroll(function(){
    $('.linked').scrollTop($(this).scrollTop());    
  })
})

function renderEditor(content, name, currentStart, currentEnd) {
  if (name){
    noteTitle.value = name
  }
  textarea.value = content
  if(currentEnd != undefined){
    textarea.setSelectionRange(currentStart, currentEnd)
  }
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
  const html = DOMPurify.sanitize(marked.parse(textarea.value), config)
  //console.log(html)
  previewWindow.innerHTML = html
}

function toggleEditorDisplay(isOn){
  if(isOn){
    preview.classList.remove('fa-align-right')
    preview.classList.add('fa-edit')
    textarea.classList.toggle('hidden', true)
    previewWindow.classList.toggle('hidden', false)
    convertHtmlToMD()
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
  } else{
    toggleEditorDisplay(false)
  }
})

function dblClickEvt(obj) {
  let pos = obj.selectionStart;
  let text = obj.value;
  let lineStart = text.lastIndexOf("\n", pos);
  if (lineStart > 0){
    obj.selectionStart = lineStart
  }
}

