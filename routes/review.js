const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const { productStar, Reviewslist } = require("../controllers/review.js");

// do rating on product
router.put("/product/review/:productId", expiryCheck, authCheck, productStar);
// router.get("/ratedAll", expiryCheck, authCheck, ratedProducts);

// list reviews based on createdOn date
router.post("/reviews", expiryCheck, Reviewslist);

module.exports = router;
