const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const {
  create,
  listAll,
  remove,
  read,
  readAdmin,
  update,
  list,
  reviewslist,
  flashlist,
  flashcurrent,
  checkFlash,
  flashreset,
  productsCount,
  productStar,
  ratedProducts,
  listSimilar,
  listRelated,
  searchFilters,
  highestprice,
} = require("../controllers/product");

// routes
router.post("/product", expiryCheck, authCheck, adminCheck, create);
router.get("/products/total", expiryCheck, productsCount);

router.get("/products/:count", expiryCheck, listAll); // products/100
router.delete("/product/:slug", expiryCheck, authCheck, adminCheck, remove);
router.post(
  "/productAdmin/:slug",
  expiryCheck,
  authCheck,
  adminCheck,
  readAdmin
);
router.get("/product/:slug", expiryCheck, read);
router.put("/product/:slug", expiryCheck, authCheck, adminCheck, update);

// list products based on bestselling
// router.post("/products", expiryCheck, list);

// list reviews based on createdOn date
router.post("/reviews", expiryCheck, reviewslist);

//Flashsale
// router.post("/products/flash", expiryCheck, flashlist);
router.post("/products/currentflash", expiryCheck, flashcurrent);
router.post("/product/checkflash/:slug", expiryCheck, checkFlash);
// router.post("/product/flashreset", expiryCheck, flashreset);

// rating
router.put("/product/review/:productId", expiryCheck, authCheck, productStar);
router.get("/ratedAll", expiryCheck, authCheck, ratedProducts);
// Similar
router.get("/product/Similar/:slug", expiryCheck, listSimilar);
// related
// router.get("/product/related/:productId", expiryCheck, listRelated);
// search
router.post("/search/filters", expiryCheck, searchFilters);
// Highest Price for price filter
router.get("/search/highestprice", expiryCheck, highestprice);

//Product review jumia
// router.post("/rateproduct/:id", authCheck, RatingProduct);

module.exports = router;
