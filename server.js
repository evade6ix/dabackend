const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

// Allow all CORS requests
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.json());

const SHOPIFY_STORE = 'game3tcg.myshopify.com';
const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN;

// === Order Status Endpoint ===
app.get('/api/order-status', async (req, res) => {
  const { orderId, email } = req.query;

  if (!orderId || !email) {
    return res.status(400).json({ error: "Missing orderId or email" });
  }

  try {
    const url = `https://${SHOPIFY_STORE}/admin/api/2023-10/orders/${orderId}.json`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_API_TOKEN,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Order not found or invalid ID" });
    }

    const data = await response.json();
    const order = data.order;

    if (order.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: "Email does not match order" });
    }

    res.json({
      name: order.name,
      status: order.fulfillment_status || "Unfulfilled",
      total: order.total_price,
      items: order.line_items.map(i => ({
        name: i.name,
        quantity: i.quantity
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`[✅ ORDER TRACKER READY] Listening on port ${PORT}`);
});
