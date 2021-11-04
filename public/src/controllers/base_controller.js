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
    if (this.fileSystem.file !== null){
      toggleTag(this.fileSystem.file, 'selected', false)
    }
    this.fileSystem.file = file
    if (file === null){
      return
    } else {
      showEditor(true)
    }
    toggleTag(file, 'selected', true)
    this.socketIO.joinFile(file.dataset.id)
    this.operation.id = file.dataset.id
    this.operation.name = file.children[file.children.length - 1].innerText
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