const express = require("express");
const router = express.Router();

const { createPaymentIntent } = require("../controllers/stripe");
// middleware
const { authCheck, expiryCheck } = require("../middlewares/auth");

router.post(
  "/create-payment-intent",
  expiryCheck,
  authCheck,
  createPaymentIntent
);

module.exports = router;
