const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const {
  productStar,
  Reviewslist,
  ratedProducts,
} = require("../controllers/review.js");

// do rating on product
router.put("/product/review/:productId", expiryCheck, authCheck, productStar);

// list reviews based on createdOn date
router.post("/reviews", expiryCheck, Reviewslist);

// list reviews based on user
router.post("/ratedAll", expiryCheck, authCheck, ratedProducts);

module.exports = router;
