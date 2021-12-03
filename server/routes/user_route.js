const router = require('express').Router();
const { handleInternalError, httpAuthenticate } = require('../../util/util');

const {
  getUserVaults,
  deleteVault,
  signIn,
  signUp,
  getUserProfile
} = require('../controllers/user_controller');

router
  .route('/user/vaults')
  .get(httpAuthenticate, handleInternalError(getUserVaults));
router.route('/user/signin').post(signIn);
router.route('/user/signup').post(signUp);
router
  .route('/user/profile')
  .get(httpAuthenticate, handleInternalError(getUserProfile));
router
  .route('/user/vault/:id')
  .delete(httpAuthenticate, handleInternalError(deleteVault));

module.exports = router;
