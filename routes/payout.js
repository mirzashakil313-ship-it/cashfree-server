const express = require('express');
const router = express.Router();
const { createPayout } = require('../controllers/payoutController');

router.post('/payout', createPayout);

module.exports = router;
