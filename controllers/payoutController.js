const axios = require('axios');

exports.createPayout = async (req, res) => {
  try {
    const response = await axios.post('https://payout-gamma.cashfree.com/payout/v1/requestTransfer', {
      beneId: 'testBene',
      amount: 1,
      transferId: 'transfer123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': process.env.CASHFREE_APP_ID,
        'X-Client-Secret': process.env.CASHFREE_SECRET_KEY
      }
    });

    res.send(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
