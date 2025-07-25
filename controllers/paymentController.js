const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

exports.createOrder = async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, amount } = req.body;

    const orderId = "Order_" + uuidv4();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
      method: 'POST',
      url: 'https://sandbox.cashfree.com/pg/orders',
      headers: {
        accept: 'application/json',
        'x-api-version': '2022-09-01',
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_CLIENT_ID,
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET
      },
      data: {
        order_id: orderId,
        order_amount: numericAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: uuidv4(),
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_name: customerName
        },
        order_meta: {
          return_url: "https://your-app.com/success?order_id={order_id}"
        }
      }
    };

    const response = await axios.request(options);
    res.status(200).json(response.data);
  } catch (err) {
    console.error("Cashfree error:", err.response?.data || err.message);
    res.status(500).json({ message: "Cashfree error", error: err.message });
  }
};
