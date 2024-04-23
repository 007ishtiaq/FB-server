const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const {
  create,
  list,
  remove,
  listRelated,
  update,
  read,
} = require("../controllers/banner");

// routes
router.post("/banner", expiryCheck, authCheck, adminCheck, create);
router.get("/banners", expiryCheck, list);
router.delete("/banner/:slug", expiryCheck, authCheck, adminCheck, remove);
router.post("/banners", expiryCheck, listRelated);
router.put("/banner/:slug", expiryCheck, authCheck, adminCheck, update);
router.get("/banner/:slug", expiryCheck, read);
// router.put("/category/:slug", expiryCheck, authCheck, adminCheck, update);

module.exports = router;
