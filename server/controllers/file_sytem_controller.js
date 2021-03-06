const FileSystem = require('../models/file_system_model');

const createFile = async (req, res) => {
  const data = req.body.data;
  const newFile = data.new;
  const revisionID = data.revision_id;
  const vaultID = data.vault_id;
  newFile['created_at'] = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
  let result;
  if (data.prev) {
    result = await FileSystem.createFile(
      newFile,
      data.new.type,
      vaultID,
      revisionID,
      data['prev']
    );
  } else if (data.parent) {
    result = await FileSystem.createFile(
      newFile,
      data.new.type,
      vaultID,
      revisionID,
      null,
      data['parent']
    );
  } else {
    result = await FileSystem.createFile(
      newFile,
      data.new.type,
      vaultID,
      revisionID
    );
  }
  if (result.error) {
    res.status(400).send(result.error);
    return;
  }
  res.send({ id: result.id, revision_id: revisionID });
};
const changeFileName = async (id, name) => {
  return await FileSystem.changeFileName(id, name);
};
const moveFile = async (dataArr, vaultID, revisionID) => {
  //console.log(dataArr, vaultID)
  const result = await FileSystem.moveFile(dataArr, vaultID, revisionID);
  if (result.error) {
    return { error: result.error };
  }
  return {};
};

const getFileSystem = async (vaultID, userID) => {
  const result = await FileSystem.getFileSystem(vaultID, userID);
  if (result.error) {
    return { error: result.error };
  }
  const { vault, files } = result;
  if (!vault || !files) {
    return { error: 'Database query error' };
  }
  let firstChild = vault.first_child_id;
  const revisionID = vault.revision_id;
  firstChild = firstChild != undefined ? firstChild : null;
  return { firstChild, files, revisionID };
};

const getFile = async (fileID) => {
  const result = await FileSystem.getFile(fileID);
  if (result.error) {
    return { error: result.error };
  }
  const file = result.file;
  if (!file) {
    return { error: 'Database query error' };
  }
  return {
    revisionID: file.revision_id,
    doc: file.text,
    recordID: file.id,
    revisionName: file.name
  };
};

const removeFiles = async (idArr, nodeData, vaultID, revisionID) => {
  if (idArr.length == 0) {
    return;
  }
  const result = await FileSystem.removeFiles(
    idArr,
    nodeData,
    vaultID,
    revisionID
  );
  if (result.error) {
    return { error: result.error };
  }
  return {};
};

const searchFiles = async (req, res) => {
  const keyword = req.query.keyword;
  const vaultID = req.query.vault_id;
  const user = req.user;
  const result = await FileSystem.searchFiles(
    user.id,
    vaultID,
    keyword.toLowerCase()
  );
  if (result.error) {
    res.status(500).send(result.error);
    return;
  }
  const ids = result.ids;
  if (ids === undefined) {
    res.status(500).send('Database query error');
    return;
  }
  res.status(200).send({ data: { ids } });
};

const getFileVersion = async (req, res) => {
  const fileID = req.params.id;
  const revisionID = req.query.revision_id;
  let result;
  if (revisionID) {
    result = await FileSystem.getFileVersion(fileID, revisionID);
    const file = result.file;
    if (!file || result.error) {
      res.status(500).send('Database query error');
      return;
    }
    res.status(200).send({ data: { doc: file.text } });
    return;
  } else {
    result = await FileSystem.getFileVersionHistory(fileID);
    const files = result.files;
    if (!files || result.error) {
      res.status(500).send('Database query error');
      return;
    }
    res.status(200).send({ data: { files } });
  }
};
const changeFileVersionName = async (req, res) => {
  const fileID = req.params.id;
  const { name, revision_id, doc } = req.body;
  if (!name || !revision_id) {
    res.status(400).send({ error: 'Wrong Request' });
    return;
  }
  const result = await FileSystem.changeFileVersionName(
    fileID,
    revision_id,
    doc,
    name
  );
  if (result.error) {
    return res.status(403).send({ error: result.error });
  }
  res.sendStatus(200);
};

const restoreFileVersion = async (fileID, revisionID) => {
  const result = await FileSystem.restoreFileVersion(fileID, revisionID);
  if (result.error) {
    return { error: result.error };
  }
  const file = result.file;
  return { doc: file.text, recordID: file.id };
};

const updateFileVersion = async (fileID, revisionID, doc, recordID) => {
  const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await FileSystem.updateFileVersion(
    fileID,
    revisionID,
    doc,
    updatedAt,
    recordID
  );
};

const createFileVersion = async (fileID, revisionID, doc) => {
  const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const recordID = await FileSystem.createFileVersion(
    fileID,
    revisionID,
    doc,
    updatedAt
  );
  return recordID;
};

module.exports = {
  createFile,
  getFileSystem,
  getFile,
  moveFile,
  changeFileName,
  removeFiles,
  searchFiles,
  getFileVersion,
  changeFileVersionName,
  restoreFileVersion,
  updateFileVersion,
  createFileVersion
};
