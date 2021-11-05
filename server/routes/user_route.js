const router = require('express').Router()
const {wrapAsync} = require('../../util/util');

const {
  getVaults,
  signIn,
  signUp,
  signOut
} = require('../controllers/user_controller')


router.route('/user/vaults')
    .get(wrapAsync(getVaults))
router.route('/user/signin')
    .get(signIn)
router.route('/user/signup')
    .get(signUp)
router.route('/user/signout')
    .get(signOut)

module.exports = router