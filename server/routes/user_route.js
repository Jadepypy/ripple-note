const router = require('express').Router()
const {wrapAsync, httpAuthenticate} = require('../../util/util');

const {
  getVaults,
  createVault,
  deleteVault,
  signIn,
  signUp,
  signOut
} = require('../controllers/user_controller')

router.route('/user/vaults')
    .get(httpAuthenticate, wrapAsync(getVaults))
router.route('/user/vault')
    .post(httpAuthenticate, wrapAsync(createVault))
router.route('/user/signin')
    .post(signIn)
router.route('/user/signup')
    .post(signUp)
router.route('/user/signout')
    .get(signOut)
router.route('/user/vault/:id')
    .delete(httpAuthenticate, wrapAsync(deleteVault))

module.exports = router