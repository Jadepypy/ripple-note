import BaseView from "./base_view.js"

class SideBarView extends BaseView {
  constructor () {
    super()
    this.arrow = this.getElement('#arrow')
    this.panel =  this.getElement('.panel')
    this.editorContainer = this.getElement('.editor-container')
    this.reminder = this.getElement('.reminder')
  }

  bindClickArrow(handler) {
    this.arrow.addEventListener('click', () => {
      if (this.arrow.matches('.fa-angle-double-left')){
        this.arrow.classList.remove('fa-angle-double-left')
        this.arrow.classList.add('fa-angle-double-right')
        this.panel.style.display='none'
        this.editorContainer.style.gridTemplateAreas = '"main main"';
        handler(arrow.dataset.state)
      } else {
        this.panel.style.display=''
        this.arrow.classList.remove('fa-angle-double-right')
        this.arrow.classList.add('fa-angle-double-left')
        this.editorContainer.style.gridTemplateAreas = '"side main"';
      }
      handler(arrow.dataset.state)
    })

  }

}

export default SideBarView