const express = require('express');

const userController = require('../controllers/user');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', userController.getHome);
router.get('/services', userController.getServices)
router.get('/book', userController.getBook);
router.get('/login',auth.loginAuth, userController.getSignin);
router.get('/logout',auth.logoutAuth, userController.getSignout);
router.get('/login/:token', userController.getSigninVerify);
router.get('/resetpassword', userController.getResetPassword);
router.get('/resetpassword/:token', userController.getNewPassword);
router.get('/signup', userController.getSignup);
router.get('/contact', userController.getContact);
router.get('/account', auth.accountAuth, userController.getAccount);

module.exports = router;