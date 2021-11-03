const router = require('express').Router()
const {wrapAsync} = require('../../util/util');

const { 
  createFile,
  getFileSystem
} = require('../controllers/file_sytem_controller')


router.route('/file')
    .post(createFile)
router.route('/file')
    .get(getFileSystem)


module.exports = router