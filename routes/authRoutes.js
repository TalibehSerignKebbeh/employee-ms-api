const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const {login, refreshToken, logout} = require('../controller/authContoller')
router.route('/').post(login)
 router.route('/refresh').get(refreshToken)
router.route('/logout').post(logout)

module.exports = router;