const router = require('express').Router()
const {wrapAsync, httpAuthenticate} = require('../../util/util');

const { 
  createFile,
  getFileVersion,
  searchFileSystem,
  changeVersionName
} = require('../controllers/file_sytem_controller')


router.route('/file')
    .post(wrapAsync(createFile))
router.route('/file/:id')
    .patch(httpAuthenticate, wrapAsync(changeVersionName))
router.route('/file/:id')
    .get(httpAuthenticate, wrapAsync(getFileVersion))
router.route('/file/:id')
    .patch(httpAuthenticate, wrapAsync(changeVersionName))
router.route('/files')
    .get(httpAuthenticate, wrapAsync(searchFileSystem))

module.exports = router