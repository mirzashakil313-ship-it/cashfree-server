const axios = require('axios');

exports.createPayment = async (req, res) => {
  try {
    const response = await axios.post('https://sandbox.cashfree.com/pg/orders', {
      order_amount: 1,
      order_currency: 'INR',
      order_id: 'ORDER12345',
      customer_details: {
        customer_id: 'CUST123',
        customer_email: 'test@example.com',
        customer_phone: '9999999999'
      }
    }, {
      headers: {
        'x-api-version': '2022-01-01',
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY
      }
    });

    res.send(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
