const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const { create, read, update, remove, list } = require("../controllers/sub2");

// routes
router.post("/sub2", expiryCheck, authCheck, adminCheck, create);
router.get("/subs2", expiryCheck, list);
router.get("/sub2/:slug", expiryCheck, read);
router.put("/sub2/:slug", expiryCheck, authCheck, adminCheck, update);
router.delete("/sub2/:slug", expiryCheck, authCheck, adminCheck, remove);

module.exports = router;
