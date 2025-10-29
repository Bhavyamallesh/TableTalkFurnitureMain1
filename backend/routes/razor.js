const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { checkerCustomer } = require("../middleware/checker");
const Order = require("../models/Orders");

// ✅ Initialize Razorpay instance using environment variables
const instance = new Razorpay({
  key_id: process.env.RAZOR_API_KEY,
  key_secret: process.env.RAZOR_SECRET_KEY,
});

// ✅ Route 1: Initialize Razorpay Payment
router.post("/razor/PayInit", checkerCustomer, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required" });
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
    };

    const order = await instance.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Error in PayInit:", err);
    res.status(500).json({ success: false, message: "Payment initialization failed", error: err.message });
  }
});

// ✅ Route 2: Verify Razorpay Payment
router.post("/razor/PayVerification", async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      cart,
      customer_id,
    } = req.body;

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment data" });
    }

    // Generate signature to verify
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Mark each item as placed
      const updatedItems = cart.map((item) => ({
        ...item,
        tracking: "Order Placed",
      }));

      // Save order in DB
      const newOrder = {
        Customer: customer_id,
        Items: updatedItems,
      };

      await Order.create(newOrder);

      return res.status(200).json({ success: true, message: "Payment verified and order placed!" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (err) {
    console.error("Error in PayVerification:", err);
    res.status(500).json({ success: false, message: "Technical error during verification", error: err.message });
  }
});

// ✅ Route 3: Send Razorpay API Key to Frontend
router.get("/razor/getKey", checkerCustomer, async (req, res) => {
  try {
    res.status(200).json({ success: true, key: process.env.RAZOR_API_KEY });
  } catch (err) {
    console.error("Error in getKey:", err);
    res.status(500).json({ success: false, message: "Error fetching key", error: err.message });
  }
});

module.exports = router;
