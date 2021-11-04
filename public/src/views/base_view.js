const  navigationTool = getElement('#navigation-tool')
const  searchTool = getElement('#search-tool')

function getElement(selector, parent) {
  let elem
  if (parent !== undefined) {
    elem = parent.querySelector(selector)
  } else{
    elem = document.querySelector(selector)
  }
  return elem
}
function getAllElements(selector) {
  const elemArr = document.querySelectorAll(selector)
  return elemArr 
}
function createElement(tagName, classList) {
  const elem = document.createElement(tagName)
  elem.classList.add(...classList)
  return elem
}
function toggleTag (elem, tag, force) {
  elem.classList.toggle(tag, force)
}
function insertAfter(e, prev) { 
  if(prev.nextElementSibling !== null){
    noteList.insertBefore(e, prev.nextElementSibling)
  } else {
    noteList.append(e)
  }
}
