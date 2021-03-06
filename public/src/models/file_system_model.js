class FileSystemModel {
  constructor () {
    this.file = null
    this.nodeMap = null
    this.head = null
  }
  buildTree(nodeMap, createNodeHandler) {
    this.head = nodeMap[0] //can not be null
    this.nodeMap = nodeMap
    this.buildNode = (node, depth, prev, parents) => {
      //console.log(node, depth, prev, parents)
      node.depth = depth
      node.prev = prev
      node.next = node.next === null? null: this.nodeMap[node.next]
      node.firstChild = node.firstChild === null? null: this.nodeMap[node.firstChild]
      node.parent = parents[depth - 1]
      if (domMap[node.id] === undefined && node.id !== this.head.id){
        domMap[node.id] = createNodeHandler(node.id, node.name, node.type, depth)
      }
      if (node.firstChild !== null){
        parents[depth] = node
        this.buildNode(node.firstChild, depth + 1, null, parents)
      }
      if (node.next !== null){
        this.buildNode(node.next, depth, node, parents)
      } else if (node.parent !== null) {
        node.parent.lastChild = node
      }
    }
    this.buildNode(this.head, 0, null, {'-1': null})
    //this.printTree()
  }
  getLastDescendant(node) {
    if (node.lastChild !== null){
      return this.getLastDescendant(node.lastChild)
    }
    return node
  }
  insertAfter(node, prev) {
    //console.log('node', node)
    //console.log('prev', prev)
    node.parent = prev.parent
    node.depth = prev.depth
    node.prev = prev
    if (prev.next !== null){
      prev.next.prev = node
      node.next = prev.next
    } else{
      node.next = null
    }
    prev.next = node
    if (node.parent.lastChild.id === prev.id){
      node.parent.lastChild = node
    }
  }
  insertBefore(node, next) {
    node.parent = next.parent
    node.depth = next.depth
    node.next = next
    if (next.prev !== null){
      next.prev.next = node
    } 
    node.prev = next.prev
    next.prev = node
    if (node.parent.firstChild.id === next.id){
      node.parent.firstChild = node
    }
  }
  removeAll(node, idArr, isFirst) {
    idArr.push(node.id)
    domMap[node.id].remove()
    delete domMap[node.id]
    if(isFirst){
      this.remove(node)
    }
    if(node.firstChild !== null){
      this.removeAll(node.firstChild, idArr, false)
    } 
    if(!isFirst && node.next !== null){
      return this.removeAll(node.next, idArr, false)
    }
    return idArr 
  }
  //self including all children removed
  remove(node) {
    const prev = node.prev
    const next = node.next
    if (prev !== null){
      node.prev.next = next
    }
    if (next !== null){
      node.next.prev = prev
    }
    if(node.parent.firstChild.id === node.id){
      if(prev !== null){
        node.parent.firstChild = prev
      } else if (next !== null){
        node.parent.firstChild = next
      } else {
        node.parent.firstChild = null
      }
    }
    if(node.parent.lastChild.id === node.id){
      if(next !== null){
        node.parent.lastChild = next
      } else if (prev !== null){
        node.parent.lastChild = prev
      } else {
        node.parent.lastChild = null
      }
    }
    // console.log(';nnode', node)
    // console.log('pprev', node.prev)
  }
  //find all children including self (tidy data for backend)
  findAllChildren(node, ids, isFirst){
    ids.add(node.id)
    if(isFirst && node.firstChild !== null){
      return this.findAllChildren(node.firstChild, ids, false)
    }else if (node.firstChild !== null){
      this.findAllChildren(node.firstChild, ids, false)
    }
    if(node.next !== null){
      return this.findAllChildren(node.next, ids, false)
    }
  }
  checkIsAncestor(node, target){
    if(target.parent.id == this.head.id){
      return false
    }
    if(target.parent.id == node.id){
      return true
    } else{
      return this.checkIsAncestor(node, target.parent)
    }
  }
  //worse O(N), have to change each child's depth
  insertUnder(node, parent) {
    if (parent.lastChild !== null){
      this.insertAfter(node, parent.lastChild)
    } else {
      parent.firstChild =node
      parent.lastChild = node
      node.parent = parent
      node.prev = null
      node.next = null
      node.depth = parent.depth + 1
    }
  }
  insertUnderAsFirstChild(node, parent) {
    //console.log('insertUnderAsFirstChild', node, parent)
    if (parent.firstChild !== null){
      this.insertBefore(node, parent.firstChild)
    } else {
      node.next = null
      parent.lastChild = node
      parent.firstChild =node
      node.parent = parent
      node.prev = null
      node.depth = parent.depth + 1
    }
  }
  changeChildrenDepth(node, increment) {
    if (node.firstChild !== null){
      this.changeChildrenDepth(node.firstChild, increment)
    }
    if (node.next !== null){
      this.changeChildrenDepth(node.next, increment)
    }
    node.depth += increment
  }
  //worse O(N), have to change each child's depth
  moveAfter(node, prev) {
    let depthBefore = node.depth
    this.remove(node)
    this.insertAfter(node, prev)
    if (depthBefore != node.depth && node.firstChild !== null){
      this.changeChildrenDepth(node.firstChild, node.depth - depthBefore)
    }
  }
  //worse O(N), have to change each child's depth
  moveUnder(node, parent) {
    let depthBefore = node.depth
    this.remove(node)
    this.insertUnder(node, parent)
    if (depthBefore !== node.depth && node.firstChild !== null){
      this.changeChildrenDepth(node.firstChild, node.depth - depthBefore)
    }
  }
  moveUnderAsFirstChild(node, parent) {
    let depthBefore = node.depth
    this.remove(node)
    this.insertUnderAsFirstChild(node, parent)
    if (depthBefore !== node.depth && node.firstChild !== null){
      this.changeChildrenDepth(node.firstChild, node.depth - depthBefore)
    }
  }
  getDuplicateElementID(name, node, type, id) {
    //console.log(name, node, type, id)
    if(node === null){
      return null
    } else if (node.name == name && node.type == type){
      id = node.id
    } else if (node.next !== null){
      node = node.next
      id = this.getDuplicateElementID(name, node, type, id)
    }
    return id
  }
  //for test
  printTree() {
   for (const id in this.nodeMap){
      const node = this.nodeMap[id]
      console.log(node.id, 'name', node.name, 'parent', getID(node.parent), 'child', getID(node.firstChild), 'lastChild', getID(node.lastChild), 'prev', getID(node.prev), 'next', getID(node.next), 'depth',node.depth)

    }
    function getID(x){
      if (x !== null){
        return x.id
      } else{
        x
      }
    }
  }

}
export default FileSystemModel