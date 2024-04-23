const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const { create, remove, list } = require("../controllers/coupon");

// routes
router.post("/coupon", expiryCheck, authCheck, adminCheck, create);
router.get("/coupons", expiryCheck, list);
router.delete("/coupon/:couponId", expiryCheck, authCheck, adminCheck, remove);

module.exports = router;
