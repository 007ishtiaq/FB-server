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
} = require("../controllers/staticText");

// routes
router.post("/admin/statictext", expiryCheck, authCheck, adminCheck, create);
router.get("/admin/statictexts", expiryCheck, list);
router.delete(
  "/admin/statictext/:slug",
  expiryCheck,
  authCheck,
  adminCheck,
  remove
);
router.post("/admin/statictexts/", expiryCheck, listRelated);
router.put(
  "/admin/statictext/:slug",
  expiryCheck,
  authCheck,
  adminCheck,
  update
);
router.get("/admin/statictext/:slug", expiryCheck, read);

module.exports = router;
