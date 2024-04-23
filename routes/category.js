const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const {
  create,
  read,
  update,
  remove,
  list,
  getCategoriesWithChildren,
  getSubs,
} = require("../controllers/category");

// routes
router.post("/category", expiryCheck, authCheck, adminCheck, create);
router.get("/categories", expiryCheck, list);
router.get("/categoriesslider", expiryCheck, getCategoriesWithChildren);
router.get("/category/:slug", expiryCheck, read);
router.put("/category/:slug", expiryCheck, authCheck, adminCheck, update);
router.delete("/category/:slug", expiryCheck, authCheck, adminCheck, remove);
router.get("/category/subs/:_id", expiryCheck, getSubs);

module.exports = router;
