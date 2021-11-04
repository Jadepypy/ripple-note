const Operation = require('../models/operation')

const createOperation = async (fileID, revisionID, doc, backUpO) => {
  await Operation.createOperation(fileID, revisionID, doc, backUpOp)
}



module.exports =  { 
                    createOperation
}
