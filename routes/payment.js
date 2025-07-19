const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/paymentController');

router.post('/pay', createPayment);

module.exports = router;
