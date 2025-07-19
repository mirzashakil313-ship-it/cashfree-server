const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const payoutRoutes = require("./routes/payout"); // ✅ Import route

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Firebase Init
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Set shared variables
app.set("db", db);
app.set("APP_ID", process.env.CASHFREE_APP_ID);
app.set("SECRET_KEY", process.env.CASHFREE_SECRET_KEY);

// Routes
app.use("/payout", (req, res, next) => {
  req.app = app; // ✅ Pass express app to route
  next();
}, payoutRoutes);

// Payment Route (optional - same file)
app.post("/create-payment", async (req, res) => {
  const axios = require("axios");
  const {
    amount,
    customer_name,
    customer_phone,
    customer_email,
    notes,
  } = req.body;

  const APP_ID = app.get("APP_ID");
  const SECRET_KEY = app.get("SECRET_KEY");
  const BASE_URL = "https://api.cashfree.com/pg";

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
          return_url: "https://example.com/thank-you",
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

    await db.collection("payments").add({
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "PENDING",
      cashfreeLinkId: response.data.link_id,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Payment Link Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Payment creation failed" });
  }
});

// Health Route
app.get("/", (req, res) => {
  res.send("✅ Cashfree Server Running");
});

app.listen(port, () => {
  console.log(`✅ Server is live at http://localhost:${port}`);
});
