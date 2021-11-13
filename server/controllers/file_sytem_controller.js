const FileSystem = require('../models/file_system')

const createFile = async(req, res) => {
  const data = req.body.data
  const newFile = data.new
  newFile['created_at'] = new Date().toISOString().slice(0, 19).replace('T', ' ')
  let id
  if(data.prev){
    id = await FileSystem.insertFileAfter(newFile, data['prev'], data.new.type)
  } else if (data.parent) {
    id = await FileSystem.insertFileUnder(newFile, data['parent'], data.new.type)
  } else{
    id = await FileSystem.insertFileUnderRoot(newFile, newFile.vault_id, data.new.type)
  }
  // console.log('new file', id)
  res.send({id})
}
const changeFileName = async (id, name) => {
  return await FileSystem.changeFileName(id, name)
}
const moveFile = async (dataArr, vaultID) => {
  //console.log(dataArr, vaultID)
  FileSystem.moveFile(dataArr, vaultID)
}

const getFileSystem = async (vaultID) => {
  console.log(vaultID)
  const result = await FileSystem.getFileSystem(vaultID)
  // console.log(result)

  let firstChild = result[0][0].first_child_id
  const files = []
  firstChild = firstChild != undefined? firstChild: null
  result[1].forEach((file) => {
    files.push({  id: file.id, 
                  name: file.name, 
                  firstChild: file.first_child_id != undefined? file.first_child_id: null,
                  next: file.next_id != undefined? file.next_id: null,
                  type: file.type
                })
  })
  console.log('init files')
  return [firstChild, files]
}

const getFile = async (fileID) => {
  const result = await FileSystem.getFile(fileID)
  if (result.error){
    return {error: result.error}
  }
  const file = result.file
  if(!file){
    return {error: 'Database query error'}
  } 
  return {revisionID: file.revision_id, doc: file.text}
}

const removeFiles = async (idArr, nodeData, vaultID) => {
  if(idArr.length == 0){
    return
  }
  const result = await FileSystem.removeFiles(idArr, nodeData, vaultID)
  if (result.error){
    return {error: result.error}
  }
  return
}

module.exports =  { 
                    createFile,
                    getFileSystem,
                    getFile,
                    moveFile,
                    changeFileName,
                    removeFiles
}
