class FileSystemModel {
  constructor () {
    this.file = null
    this.nodeMap = null
    this.head = null
  }
  buildTree(rootNode, nodeMap, createNodeHandler) {
    this.head = rootNode //can not be null
    this.nodeMap = nodeMap
    this.buildNode = (node, depth, prev, parents) => {
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
  }
  //find the previous node_id of the new folder/file, a bit tricky since js doesn't support insertAftr
  getDataBeforeInsertion() {
    if (this.file !== null){
      const prevNode = this.nodeMap[this.file.dataset.id]
      if (prevNode.next !== null || prevNode.firstChild !== null){
        return [this.file, prevNode, prevNode.parent]
      } else if (prevNode.parent.next !== null){
        return [domMap[prevNode.id], prevNode, prevNode.parent]
      }  
      else{
        return [null, prevNode, prevNode.parent]
      }
    } else if (this.head.lastChild !== null){
      const lastChild = this.head.lastChild
      if (lastChild.lastChild !== null){
        const lastDescendant = this.getLastDescendant(lastChild)
            console.log(lastDescendant.id)

        return [domMap[lastDescendant.id], lastChild, this.head]
      } else if (lastChild.next !== null) {
        return [domMap[lastChild.id], lastChild, this.head]
      } else {
        return [null, lastChild, this.head]
      }
    }
    return [null, null, this.head.id]
  }
  // insertAfterNode(node) {
  //   if(node.next !== null){
  //       const nextID = node.next.id
  //       this.noteList.insertBefore(element, this.nodeMap.domMap[nextID])
  //   } else if (node.parent.next !== null){
  //     const nextID = node.parent.next
  //     this.noteList.insertBefore(element, this.nodeMap.domMap[nextID])
  //   } else {
  //     this.noteList.appendChild(element)
  //   }
  // }
  getLastDescendant(node, lastDescendant) {
    if (node.lastChild !== null){
      lastDescendant = this.getLastDescendant(node.lastChild)
    } else{
      lastDescendant = node
    }
    return lastDescendant
  }
  insertAfter(node, prev) {
    console.log('node', node)
    console.log('prev', prev)
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
    console.log(';nnode', node)
    console.log('pprev', node.prev)
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
    if (parent.firstCild !== null){
      this.insertBefore(node, parent.firstChild)
    } else {
      if (parent.firstChild !== null){
        node.next = parent.firstChild
        parent.firstChild.prev = node
      } else{
        node.next = null
        parent.lastChild = node
      }
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
    console.log('?')
    console.log(name, node, type, id)
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