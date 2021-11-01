class BaseView {
  constructor () {
    this.navigationTool = this.getElement('#navigation-tool')
    this.searchTool = this.getElement('#search-tool')
    this.pElemList = this.getAllElements('p')
  }
  getElement(selector, parent) {
    let elem
    if (parent !== undefined) {
      elem = parent.querySelector(selector)
    } else{
      elem = document.querySelector(selector)
    }
    return elem
  }
  getAllElements(selector) {
    const elemArr = document.querySelectorAll(selector)
    return elemArr 
  }
  createElement(tagName, classList) {
    const elem = document.createElement(tagName)
    elem.classList.add(...classList)
    return elem
  }
  toggleTag (elem, tag, force) {
    elem.classList.toggle(tag, force)
  }

}

export default BaseView