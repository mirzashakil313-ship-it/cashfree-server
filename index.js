const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const paymentRoutes = require('./routes/paymentRoutes');
const payoutRoutes = require('./routes/payoutRoutes');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/payment', paymentRoutes);
app.use('/api/payout', payoutRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
