const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

exports.transferToBank = async (req, res) => {
  try {
    const { amount, name, phone, ifsc, bankAccount } = req.body;

    const tokenRes = await axios.post('https://payout-gamma.cashfree.com/payout/v1/authorize', {}, {
      headers: {
        'X-Client-Id': process.env.CASHFREE_APP_ID,
        'X-Client-Secret': process.env.CASHFREE_SECRET_KEY
      }
    });

    const token = tokenRes.data.data.token;

    const transferRes = await axios.post(
      'https://payout-gamma.cashfree.com/payout/v1/directTransfer',
      {
        beneDetails: {
          bankAccount,
          ifsc,
          name,
          phone
        },
        transferMode: "banktransfer",
        amount,
        transferId: uuidv4()
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json(transferRes.data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during payout", error: err });
  }
};
