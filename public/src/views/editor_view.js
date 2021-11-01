import BaseView from "./base_view.js"
import {STATE, OP_TYPE, SPECIAL_KEYS} from '../utils/enum.js'

class EditorView extends BaseView{
  constructor (){
    super()
    this.noteTitle = this.getElement('#note-title')
    this.textarea = this.getElement('#note')
    this.trash = document.querySelector('#trash-icon')
    this.editor = this.getElement('.editor')
    this.reminder = this.getElement('.reminder')
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
        opInfo.push({opType: OP_TYPE.DELETE, pos: indexEnd, count: Math.min(indexStart - indexEnd, -1)})
        console.log('opinfo:', opInfo)
      } else {
        if (indexEnd - indexStart > 0){
          opInfo.push({opType: OP_TYPE.DELETE, pos: indexEnd, count: indexStart - indexEnd})
        }
        opInfo.push({opType: OP_TYPE.INSERT, pos: indexStart, key: key})
      }
        handler(opInfo)
    })
  }
}

export default EditorView