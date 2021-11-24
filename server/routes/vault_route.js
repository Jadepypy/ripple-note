const router = require('express').Router()
const {handleInternalError, httpAuthenticate} = require('../../util/util');

const {
  getVault,
  createVault,
  addVaultUser,
  changeVaultName
} = require('../controllers/vault_controller')

router.route('/vault/users')
    .post(httpAuthenticate, handleInternalError(addVaultUser))
router.route('/vault/:id')
    .get(httpAuthenticate, handleInternalError(getVault))
router.route('/vault/:id')
    .patch(httpAuthenticate, handleInternalError(changeVaultName))
router.route('/vault')
    .post(httpAuthenticate, handleInternalError(createVault))


module.exports = router