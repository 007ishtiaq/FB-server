const express = require("express");

const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");
// controllers
const {
  userCart,
  getUserCart,
  emptyCart,
  saveAddress,
  getAddress,
  saveProfile,
  getProfile,
  couponValidation,
  applyCouponToUserCart,
  removeCouponFromUserCart,
  orders,
  cancelledorders,
  returnedorders,
  order,
  addToWishlist,
  wishlist,
  removeFromWishlist,
  createCashOrder,
  createOrder,
  shippingcreate,
  shippinglist,
  shippingremove,
  createCancellation,
  createReturn,
  handlenewsletterSubscribe,
  handlechecknewsSubs,
} = require("../controllers/user");

router.post("/user/cart", expiryCheck, authCheck, userCart); // save cart
router.get("/user/cart", expiryCheck, authCheck, getUserCart); // get cart
router.delete("/user/cart", expiryCheck, authCheck, emptyCart); // empty cart
router.post("/user/address", expiryCheck, authCheck, saveAddress);
router.get("/user/address", expiryCheck, authCheck, getAddress);

//user profile
router.post("/user/profile", expiryCheck, authCheck, saveProfile);
router.get("/user/profile", expiryCheck, authCheck, getProfile);

//user order handling
router.post("/user/order", expiryCheck, authCheck, createOrder); // BFT, Waller, easypesa
router.post("/user/cash-order", expiryCheck, authCheck, createCashOrder); // cod
router.post("/user/orders", expiryCheck, authCheck, orders);
router.post("/user/cancelledorders", expiryCheck, authCheck, cancelledorders);
router.post("/user/returnedorders", expiryCheck, authCheck, returnedorders);
router.get("/order/:id", expiryCheck, authCheck, order);

// coupon
router.post(
  "/user/cart/couponValidate",
  expiryCheck,
  authCheck,
  couponValidation
);
router.post("/user/cart/coupon", expiryCheck, authCheck, applyCouponToUserCart);
router.post(
  "/user/cart/removecoupon",
  expiryCheck,
  authCheck,
  removeCouponFromUserCart
);

// shipping
router.post("/shipping", expiryCheck, authCheck, adminCheck, shippingcreate);
router.get("/shippings", expiryCheck, shippinglist);
router.delete(
  "/shipping/:shippingId",
  expiryCheck,
  authCheck,
  adminCheck,
  shippingremove
);

// wishlist
router.post("/user/wishlist", expiryCheck, authCheck, addToWishlist);
router.get("/user/wishlist", expiryCheck, authCheck, wishlist);
router.put(
  "/user/wishlist/:productId",
  expiryCheck,
  authCheck,
  removeFromWishlist
);

//Product cancellation & Return
router.post("/user/product/cancel", expiryCheck, authCheck, createCancellation);
router.post("/user/product/return", expiryCheck, authCheck, createReturn);

// wishlist
router.post(
  "/user/newsletterSubscribe",
  expiryCheck,
  authCheck,
  handlenewsletterSubscribe
);
router.get("/checknewsSubs", expiryCheck, authCheck, handlechecknewsSubs);
// router.get("/user/wishlist", expiryCheck, authCheck, wishlist);

// router.get("/user", expiryCheck, (req, res) => {
//   res.json({
//     data: "hey you hit user API endpoint", expiryCheck,
//   });
// });

module.exports = router;
