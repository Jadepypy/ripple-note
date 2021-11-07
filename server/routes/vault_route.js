const router = require('express').Router()
const {wrapAsync, httpAuthenticate} = require('../../util/util');

const {
  getVault,
  addVaultUser,
  changeVaultName
} = require('../controllers/user_controller')

router.route('/vault/users')
    .post(httpAuthenticate, wrapAsync(addVaultUser))
router.route('/vault/:id')
    .get(httpAuthenticate, wrapAsync(getVault))
router.route('/vault/:id')
    .patch(httpAuthenticate, wrapAsync(changeVaultName))


module.exports = router