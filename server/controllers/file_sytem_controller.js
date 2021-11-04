const FileSystem = require('../models/file_system')

const createFile = async(req, res) => {
  const data = req.body
  const newFile = data.new
  newFile['created_at'] = new Date().toISOString().slice(0, 19).replace('T', ' ')
  let id
  if(data.prev){
    id = await FileSystem.insertFileAfter(newFile, data['prev'])
  } else{
    id = await FileSystem.insertFileUnderRoot(newFile, newFile.vault_id)
  }
  console.log(id)
  res.send({id})
}
const changeFileName = async (id, name) => {
  await FileSystem.changeFileName(id, name)
}

const getFileSystem = async (vaultID) => {
  const result = await FileSystem.getFileSystem(vaultID)
  console.log(result[0])
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
  console.log(files)
  
  return [firstChild, files]
}


module.exports =  { 
                    createFile,
                    getFileSystem,
                    changeFileName
}
