const router = require('express').Router()
const {wrapAsync, httpAuthenticate} = require('../../util/util');

const { 
  createFile,
  getFileSystem,
  searchFileSystem
} = require('../controllers/file_sytem_controller')


router.route('/file')
    .post(createFile)
router.route('/file')
    .get(getFileSystem)
router.route('/files')
    .get(httpAuthenticate, wrapAsync(searchFileSystem))


module.exports = router