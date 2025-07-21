const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

exports.createOrder = async (req, res) => {
  try {
    const { amount, customerName, customerPhone, customerEmail } = req.body;
    const orderId = "Order_" + uuidv4();

    // Ensure amount is a number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return res.status(400).json({ message: "Invalid amount provided." });
    }

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
        order_amount: numericAmount, // Yahan badlav kiya gaya hai
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
    // Log the detailed error from Cashfree if available
    console.error("Cashfree Error:", err.response ? err.response.data : err.message);
    res.status(500).json({ message: "Error creating Cashfree order", error: err.response ? err.response.data : err.message });
  }
};
