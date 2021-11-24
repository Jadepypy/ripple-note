const FileSystem = require('../models/file_system_model')

const createFile = async(req, res) => {
  const data = req.body.data
  const newFile = data.new
  const revisionID = data.revision_id
  const vaultID = data.vault_id
  newFile['created_at'] = new Date().toISOString().slice(0, 19).replace('T', ' ')
  let result
  if(data.prev){
    result = await FileSystem.insertFileAfter(newFile, data['prev'], data.new.type, vaultID, revisionID)
  } else if (data.parent) {
    result = await FileSystem.insertFileUnder(newFile, data['parent'], data.new.type, vaultID, revisionID)
  } else{
    result = await FileSystem.insertFileUnderRoot(newFile, newFile.vault_id, data.new.type,revisionID)
  }
  if(result.error){
    res.status(400).send(result.error)
    return
  }
  // console.log('new file', id)
  res.send({id: result.id, revision_id: revisionID})
}
const changeFileName = async (id, name) => {
  return await FileSystem.changeFileName(id, name)
}
const moveFile = async (dataArr, vaultID, revisionID) => {
  //console.log(dataArr, vaultID)
  const result = await FileSystem.moveFile(dataArr, vaultID, revisionID)
  if(result.error){
    return {error: result.error}
  }
  return {}
}

const getFileSystem = async (vaultID) => {
  const result = await FileSystem.getFileSystem(vaultID)
  // console.log(result)
  let firstChild = result[0][0].first_child_id
  const revisionID = result[0][0].revision_id
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
  //console.log('init files')
  return [firstChild, files, revisionID]
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
  return {revisionID: file.revision_id, doc: file.text, recordID: file.id}
}

const removeFiles = async (idArr, nodeData, vaultID, revisionID) => {
  if(idArr.length == 0){
    return
  }
  const result = await FileSystem.removeFiles(idArr, nodeData, vaultID, revisionID)
  if (result.error){
    return {error: result.error}
  }
  return {}
}

const searchFileSystem = async (req, res) => {
  const keyword = req.query.keyword
  const vaultID = req.query.vault_id
  const user = req.user
  const result = await FileSystem.searchFileSystem(user.id, vaultID, keyword.toLowerCase())
  if (result.error){
    res.status(500).send(result.error)
  }
  const ids = result.ids
  if(!ids){
    res.status(500).send('Database query error')
  } else if (ids.length == 0){
    res.status(500).send('Database query error')
  }
  const idSet = new Set() 
  ids[0].forEach((id) => {
    idSet.add(id.id)
  })
  ids[1].forEach((id) => {
    idSet.add(id.id)
  })
  res.status(200).send({data: [...idSet]})
}

const getFileVersion = async (req, res) => {
  const fileID = req.params.id
  const revisionID = req.query.revision_id
  let result
  if(revisionID){
    result = await FileSystem.getFileVersion(fileID, revisionID)
    const file = result.file
    if(!file || result.error){
      res.status(500).send('Database query error')
      return
    }
    res.status(200).send({data: {doc: file.text}})
    return
  } else{
    result = await FileSystem.getFileVersionHistory(fileID)
    const files = result.files
    if(!files || result.error){
      res.status(500).send('Database query error')
      return
    }
    res.status(200).send({data: {files}})
  }
}
const changeVersionName = async (req ,res) => {
  const fileID = req.params.id
  const {name, revision_id, doc} = req.body
  if (!name){
    res.status(400).send({error:'Wrong Request'})
    return  
  }
  const result = await FileSystem.changeVersionName(fileID, revision_id, doc, name)
  if(result.error){
    return res.status(403).send({error: result.error})
  }
  res.sendStatus(200)
}

const restoreVersion = async (fileID, revisionID) => {
  const result = await FileSystem.restoreVersion(fileID, revisionID)
  if(result.error){
    return {error: result.error}
  }
  const file = result.file
  return {doc: file.text, recordID: file.id}
}

module.exports =  { 
                    createFile,
                    getFileSystem,
                    getFile,
                    moveFile,
                    changeFileName,
                    removeFiles,
                    searchFileSystem,
                    getFileVersion,
                    changeVersionName,
                    restoreVersion
}
