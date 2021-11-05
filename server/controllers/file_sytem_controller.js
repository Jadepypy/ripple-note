const FileSystem = require('../models/file_system')

const createFile = async(req, res) => {
  const data = req.body.data
  const newFile = data.new
  newFile['created_at'] = new Date().toISOString().slice(0, 19).replace('T', ' ')
  let id
  if(data.prev){
    id = await FileSystem.insertFileAfter(newFile, data['prev'], data.new.type)
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
  console.log(dataArr, vaultID)
  FileSystem.moveFile(dataArr, vaultID)
}

const getFileSystem = async (vaultID) => {
  // console.log(vaultID)
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
  console.log('init files', files)
  return [firstChild, files]
}

const getFile = async (fileID) => {
  const {text, revision_id} = await FileSystem.getFile(fileID)
  // console.log(text, revision_id)
  return {revisionID: revision_id, doc: text}
}

// const getFileSystem = async (vaultID) => {
//   return await FileSystem.getFileSystem(vaultID)
// }


module.exports =  { 
                    createFile,
                    getFileSystem,
                    getFile,
                    moveFile,
                    changeFileName,
}
