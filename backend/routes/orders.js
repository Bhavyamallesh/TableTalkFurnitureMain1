const express = require("express");
const router = express.Router();
const Order = require("../models/Orders");
const { checkerAdmin, checkerCustomer } = require("../middleware/checker");

// Get all orders for a specific customer
router.get("/getorders/:id", checkerCustomer, async (req, res) => {
  try {
    const CustomerOrder = await Order.find({ Customer: req.params.id });
    return res.status(200).json({ success: true, CustomerOrder });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching customer orders", error: err.message });
  }
});

// Get all orders (admin only)
router.get("/getAllOrders", checkerAdmin, async (req, res) => {
  try {
    const Order_Data = await Order.find({});
    res.status(200).json({ success: true, Order_Data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching all orders", error: err.message });
  }
});

module.exports = router;
