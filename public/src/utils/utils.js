class Node {
  constructor(id, firstChild, next, type, name) {
    //console.log('node', id, firstChild, next, type, name)
    this.id = id
    this.type = String(type)
    this.name = name
    this.parent = null 
    this.prev = null
    this.next = next
    this.firstChild = firstChild
    this.lastChild = null
    this.depth = 0
  }
}

export {Node}