// import {STATE, OP_TYPE} from '../utils/enum.js'
import {Node} from '../utils/utils.js'

class BaseController {
  constructor (operation, fileSystem, socketIO, api){
    //models
    this.operation = operation
    this.fileSystem = fileSystem

    //utils
    this.socketIO = socketIO
    this.api = api
  }

  changeSelectedFile(file) {
    console.log('change')
    const storage = window.sessionStorage
    storage.removeItem('file_id')
    if (this.fileSystem.file !== null){
      toggleTag(this.fileSystem.file, 'selected', false)
    }
    this.fileSystem.file = file
    if (file === null){
      showEditor(false)
      return
    } else {
      showEditor(true)
    }
    toggleTag(file, 'selected', true)
    this.socketIO.joinFile(file.dataset.id)
    this.operation.id = file.dataset.id
    this.operation.name = file.children[file.children.length - 2].innerText
    storage.setItem('file_id', file.dataset.id)
    for(const id in this.operation.carets){
      this.operation.carets[id].remove()
    }
    this.operation.carets = {}
  }
  getNodeData(id){
    const node = this.fileSystem.nodeMap[id]
    const data =  {
      id: node.id,
      name: node.name,
      type: node.type,
      vault_id: this.socketIO.vaultID
    }
    if(node.next !== null){
      data['next'] = node.next.id
    } 
    if(node.firstChild !== null){
      data['first_child'] = node.firstChild.id
    } 
    return data
  }

}

export default BaseController