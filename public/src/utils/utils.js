class Node {
  constructor(id, firstChild, next, type, name) {
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

// class FileTree {
//   //may change to tree constructed by backend first
//   constructor(rootNode, nodeMap) {
//     if (rootNode === undefined){
//       this.head = null
//       this.nodeMap = null
//       return
//     }
//     this.head = rootNode
//     this.nodeMap = nodeMap 
//     this.buildTree(this.head, 0, null, {'-1': null})
//   }
//   buildTree(node, depth, prev, parents) {
//     node.depth = depth
//     node.prev = prev
//     node.next = node.next === null? null: this.nodeMap[node.next]
//     node.firstChild = node.firstChild === null? null: this.nodeMap[node.firstChild]
//     node.parent = parents[depth - 1]
//     if (node.firstChild !== null){
//       parents[depth] = node
//       this.buildTree(node.firstChild, depth + 1, null, parents)
//     }
//     if (node.next !== null){
//       this.buildTree(node.next, depth, null, parents)
//     } else if (node.parent !== null) {
//       node.parent.lastChild = node
//     }
//   }
//   insertAfter(node, prev) {
//     node.parent = prev.parent
//     node.depth = prev.depth
//     node.prev = prev
//     if (prev.next !== null){
//       prev.next.prev = node
//     }
//     prev.next = node
//     if (node.parent.lastChild.id === prev.id){
//       node.parent.lastChild = node
//     }
//   }
//   insertBefore(node, next) {
//     node.parent = next.parent
//     node.depth = next.depth
//     node.next = next
//     if (next.prev !== null){
//       next.prev.next = node
//     }
//     next.prev = node
//     if (node.parent.firstChild.id === next.id){
//       node.parent.firstChild = node
//     }
//   }
//   //self including all children removed
//   remove(node) {
//     prev = node.prev
//     next = node.next
//     if (prev !== null){
//       node.prev.next = next
//     }
//     if (next !== null){
//       node.next.prev = prev
//     }
//     if(node.parent.firstChild.id === node.id){
//       if(prev !== null){
//         node.parent.firstChild = prev
//       } else if (next !== null){
//         node.parent.firstChild = next
//       } else {
//         node.firstChild = null
//       }
//     }
//     if(node.parent.lastChild.id === node.id){
//       if(next !== null){
//         node.parent.lastChild = next
//       } else if (prev !== null){
//         node.parent.lastChild = prev
//       } else {
//         node.lastChild = null
//       }
//     }
//   }
//   //worse O(N), have to change each child's depth
//   insertUnder(node, parent) {
//     if (parent.lastChild !== null){
//       this.insertAfter(node, parent.lastChild)
//     } else {
//       this.parent.firstChild =node
//       this.parent.lastChild =node
//       node.parent = parent
//       node.prev = null
//       node.next = null
//       node.depth = parent.depth + 1
//     }
//   }
//   changeChildrenDepth(node, increment) {
//     if (node.firstChild !== null){
//       this.changeChildrenDepth(rootID, node.firstChild, increment)
//     }
//     if (node.next !== null){
//       this.changeChildrenDepth(rootID, node.next, increment)
//     }
//     node.depth += increment
//   }
//   //worse O(N), have to change each child's depth
//   moveBefore(node, prev) {
//     let depthBefore = node.depth
//     this.remove(node)
//     this.insertBefore(node, prev)
//     if (depthBefore !== node.depth && node.firstChild !== null){
//       this.changeChildrenDepth(node.firstChild, node.depth - depthBefore)
//     }
//   }
//   //worse O(N), have to change each child's depth
//   moveUnder(node, parent) {
//     let depthBefore = node.depth
//     this.remove(node)
//     this.insertUnder(node, parent)
//     if (depthBefore !== node.depth && node.firstChild !== null){
//       this.changeChildrenDepth(node.firstChild, node.depth - depthBefore)
//     }
//   }
// }

export {Node}