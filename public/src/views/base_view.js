class BaseView {
  constructor () {
    this.navigationTool = this.getElement('#navigation-tool')
    this.searchTool = this.getElement('#search-tool')
  
  }
  getElement(selector) {
    const element = document.querySelector(selector)
    return element
  }
}

export default BaseView