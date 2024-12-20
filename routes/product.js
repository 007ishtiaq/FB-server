const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const {
  create,
  listAll,
  listByPage,
  remove,
  getjsondata,
  uploadjsondata,
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
  listSimilar,
  searchFilters,
  highestprice,
} = require("../controllers/product");

// routes
router.post("/product", expiryCheck, authCheck, adminCheck, create);
router.get("/products/total", expiryCheck, productsCount);

router.get("/productsByCount/:count", expiryCheck, listAll);
router.post("/productsByPage", expiryCheck, listByPage);

router.delete("/product/:slug", expiryCheck, authCheck, adminCheck, remove);
router.get("/getproductsjson", expiryCheck, authCheck, adminCheck, getjsondata);
router.post(
  "/uploadproductsjson",
  expiryCheck,
  authCheck,
  adminCheck,
  uploadjsondata
);

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

//Flashsale
// router.post("/products/flash", expiryCheck, flashlist);
router.post("/products/currentflash", expiryCheck, flashcurrent);
router.post("/product/checkflash/:slug", expiryCheck, checkFlash);
// router.post("/product/flashreset", expiryCheck, flashreset);

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
