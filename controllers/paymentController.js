const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

exports.createOrder = async (req, res) => {
  try {
    const { amount, customerName, customerPhone, customerEmail } = req.body;
    const orderId = "Order_" + uuidv4();

    const options = {
      method: 'POST',
      url: 'https://sandbox.cashfree.com/pg/orders',
      headers: {
        accept: 'application/json',
        'x-api-version': '2022-09-01',
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY
      },
      data: {
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: uuidv4(),
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_name: customerName
        },
        order_meta: {
          return_url: "https://example.com/payment-status?order_id={order_id}"
        }
      }
    };

    const response = await axios.request(options);
    res.status(200).json(response.data);

  } catch (err) {
    res.status(500).json({ message: "Error creating Cashfree order", error: err });
  }
};
