const express = require('express');
const axios = require('axios');
const admin = require('firebase-admin');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

// Firebase Admin SDK init
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com"
});

// Cashfree credentials (use Render's env vars for security)
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// 1. Pay-in (Customer Payment)
app.post('/api/payments/create-session', async (req, res) => {
  const { orderId, amount, customerName, customerEmail, customerPhone } = req.body;
  try {
    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: customerEmail || customerPhone,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_name: customerName,
        },
      },
      {
        headers: {
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Payout (Seller Withdrawal)
app.post('/api/payouts/withdraw', async (req, res) => {
  const { sellerId, amount, bankAccount, ifsc, name } = req.body;
  try {
    const response = await axios.post(
      "https://payout-gamma.cashfree.com/payout/v1/requestTransfer",
      {
        beneId: sellerId,
        amount: amount,
        transferId: `payout_${Date.now()}`,
        transferMode: "banktransfer",
        remarks: "Seller Payout",
        bankAccount: bankAccount,
        ifsc: ifsc,
        name: name,
      },
      {
        headers: {
          "X-Client-Id": CASHFREE_APP_ID,
          "X-Client-Secret": CASHFREE_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Webhook (Payment/Payout Status)
app.post('/api/cashfree/webhook', async (req, res) => {
  const { order_id, order_status, payout_id, payout_status } = req.body;
  try {
    if (order_id && order_status) {
      await admin.firestore().collection('orders').doc(order_id).update({ status: order_status });
    }
    if (payout_id && payout_status) {
      await admin.firestore().collection('payouts').doc(payout_id).update({ status: payout_status });
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
