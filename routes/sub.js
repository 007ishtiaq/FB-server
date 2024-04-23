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
  getSubs2,
} = require("../controllers/sub");

// routes
router.post("/sub", expiryCheck, authCheck, adminCheck, create);
router.get("/subs", expiryCheck, list);
router.get("/sub/:slug", expiryCheck, read);
router.put("/sub/:slug", expiryCheck, authCheck, adminCheck, update);
router.delete("/sub/:slug", expiryCheck, authCheck, adminCheck, remove);
router.get("/subs/sub2/:_id", expiryCheck, getSubs2);

module.exports = router;
