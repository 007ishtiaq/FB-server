const express = require("express");
const router = express.Router();

const {
  CreatePaypalorder,
  // CapturePaypalPayment,
} = require("../controllers/paypal");
// middleware
const { authCheck, expiryCheck } = require("../middlewares/auth");

router.post("/paypal-create-order", expiryCheck, CreatePaypalorder);
// router.post(
//   "/capture-paypal-payment",
//   expiryCheck,
//   authCheck,
//   CapturePaypalPayment
// );

module.exports = router;
