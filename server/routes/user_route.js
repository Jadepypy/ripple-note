const router = require('express').Router()
const {wrapAsync, httpAuthenticate} = require('../../util/util');

const {
  getVaults,
  signIn,
  signUp,
  signOut
} = require('../controllers/user_controller')


router.route('/user/vaults')
    .get(httpAuthenticate, wrapAsync(getVaults))
router.route('/user/signin')
    .post(signIn)
router.route('/user/signup')
    .post(signUp)
router.route('/user/signout')
    .get(signOut)

module.exports = router