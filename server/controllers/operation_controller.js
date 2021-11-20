const Operation = require('../models/operation')

const updateOperation = async (fileID, revisionID, doc, recordID) => {
  const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await Operation.updateOperation(fileID, revisionID, doc, updatedAt, recordID)
}

const createOperation = async (fileID, revisionID, doc) => {
  const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await Operation.createOperation(fileID, revisionID, doc, updatedAt)
}

module.exports =  { 
                    updateOperation,
                    createOperation
}
