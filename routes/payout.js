const express = require('express');
const router = express.Router();
const { transferToBank } = require('../controllers/payoutController');

router.post('/transfer', transferToBank);

module.exports = router;
