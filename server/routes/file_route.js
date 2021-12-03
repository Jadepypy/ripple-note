const router = require('express').Router();
const { handleInternalError, httpAuthenticate } = require('../../util/util');

const {
  createFile,
  getFileVersion,
  searchFiles,
  changeFileVersionName
} = require('../controllers/file_sytem_controller');

router.route('/file').post(handleInternalError(createFile));
router
  .route('/file/:id')
  .get(httpAuthenticate, handleInternalError(getFileVersion));
router
  .route('/file/:id')
  .patch(httpAuthenticate, handleInternalError(changeFileVersionName));
router.route('/files').get(httpAuthenticate, handleInternalError(searchFiles));

module.exports = router;
