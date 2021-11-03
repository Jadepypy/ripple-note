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
router.route('/user/vaults')
    .get(signIn)
router.route('/user/vaults')
    .get(signUp)
router.route('/user/vaults')
    .get(signOut)

module.exports = router