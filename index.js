// otp_server.js (Rename to index.js if using Render)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Firebase Admin Init
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Cashfree Credentials
const APP_ID = process.env.CASHFREE_APP_ID;
const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const BASE_URL = "https://api.cashfree.com/pg"; // For production use: https://api.cashfree.com/pg
const PAYOUT_URL = "https://payout-api.cashfree.com/payout/v1"; // Production payout URL

//----------------------------------
// 🔹 Create Payment Link (Cashfree)
//----------------------------------
app.post("/create-payment", async (req, res) => {
  const { amount, customer_name, customer_phone, customer_email, notes } = req.body;

  try {
    const response = await axios.post(
      `${BASE_URL}/links`,
      {
        customer_details: {
          customer_name,
          customer_email,
          customer_phone,
        },
        link_notify: {
          send_sms: true,
          send_email: true,
        },
        link_meta: {
          return_url: "https://example.com/thank-you", // Replace with your app return URL
        },
        link_amount: amount,
        link_currency: "INR",
        link_purpose: "Payment for order",
        link_notes: notes || {},
      },
      {
        headers: {
          "x-api-version": "2022-09-01",
          "x-client-id": APP_ID,
          "x-client-secret": SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // Save to Firestore (optional)
    await db.collection("payments").add({
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "PENDING",
      cashfreeLinkId: response.data.link_id,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error creating payment link:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment creation failed" });
  }
});

//----------------------------------
// 🔹 Cashfree Payout (Bank Transfer)
//----------------------------------
app.post("/payout", async (req, res) => {
  const { bank_account, ifsc, amount, name, phone } = req.body;

  try {
    const tokenRes = await axios.post(
      `${PAYOUT_URL}/authorize`,
      {},
      {
        headers: {
          "X-Client-Id": APP_ID,
          "X-Client-Secret": SECRET_KEY,
        },
      }
    );

    const token = tokenRes.data.data.token;

    const transferRes = await axios.post(
      `${PAYOUT_URL}/requestTransfer`,
      {
        beneId: phone,
        amount,
        transferId: `tx_${Date.now()}`,
        transferMode: "banktransfer",
        remarks: "Payout",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Save to Firestore (optional)
    await db.collection("payouts").add({
      name,
      phone,
      amount,
      bank_account,
      ifsc,
      status: "PROCESSING",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      response: transferRes.data,
    });

    res.json(transferRes.data);
  } catch (error) {
    console.error("Payout Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payout failed" });
  }
});

//-----------------------------
// ✅ Health Check Route
//-----------------------------
app.get("/", (req, res) => {
  res.send("Cashfree API is running ✅");
});

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
