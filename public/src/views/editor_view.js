import BaseView from "./base_view.js"
import {backlink, config} from "../utils/utils.js"
//import {STATE, OP_TYPE, SPECIAL_KEYS} from '../utils/enum.js'

class EditorView extends BaseView{
  constructor (){
    super()
    this.noteTitle = this.getElement('#note-title')
    this.textarea = this.getElement('#note')
    this.trash = document.querySelector('#trash-icon')
    this.editor = this.getElement('.editor')
    this.reminder = this.getElement('.reminder')
    this.preview = this.getElement('#preview-icon')
    this.mdModeIsOn = true
    this.previewWindow = document.querySelector('#preview-window')
    this.initPreviewIconListener()
  }
  renderEditor(content, name) {
    if (name){
      this.noteTitle.value = name
    }
    this.textarea.value = content
  }
  bindTrashIcon(changeSelectedFile){
    this.trash.addEventListener('click', (event) => {
      this.showEditor(false)
      changeSelectedFile(null)
    })
  }
  showEditor(fileIsOpen) {
    if(fileIsOpen){
      this.toggleEditorDisplay(false)
      this.editor.classList.toggle('hidden', false)
      this.reminder.classList.toggle('hidden', true)
    } else{
      this.editor.classList.toggle('hidden', true)
      this.reminder.classList.toggle('hidden', false)

    }
  }
  bindTextAreaEdit(handler) {
    const textarea = this.textarea
    textarea.addEventListener('keydown', function (event) {
      let key = event.key == 'Enter'? '\n' : event.key
      const indexStart = textarea.selectionStart
      const indexEnd = textarea.selectionEnd
      if (SPECIAL_KEYS.includes(key)) return
      let opInfo = []
      if (key == 'Backspace'){
        opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: Math.min(indexStart - indexEnd, -1)})
        console.log('opinfo:', opInfo)
      } else {
        if (indexEnd - indexStart > 0){
          opInfo.push({type: OP_TYPE.DELETE, position: indexEnd, count: indexStart - indexEnd})
        }
        opInfo.push({type: OP_TYPE.INSERT, position: indexStart, key: key})
      }
        handler(opInfo)
    })
  }
  convertHtmlToMD() {
    marked.use({ extensions: [backlink]})
    const html = DOMPurify.sanitize(marked(this.textarea.value), config)
    this.previewWindow.innerHTML = html
  }
  initPreviewIconListener(){
    this.preview.addEventListener('click', () => {
      if (this.mdModeIsOn){
        this.toggleEditorDisplay(true)
        this.convertHtmlToMD()
        this.mdModeIsOn = false
      } else{
        this.toggleEditorDisplay(false)
        this.mdModeIsOn = true
      }
    })
  }
  toggleEditorDisplay(isOn){
    if(isOn){
      this.preview.classList.remove('fa-align-right')
      this.preview.classList.add('fa-edit')
      this.textarea.classList.toggle('hidden', true)
      this.previewWindow.classList.toggle('hidden', false)
    } else{
      this.preview.classList.add('fa-align-right')
      this.preview.classList.remove('fa-edit')
      this.textarea.classList.toggle('hidden', false)
      this.previewWindow.classList.toggle('hidden', true)
    }
  }
}

export default EditorView