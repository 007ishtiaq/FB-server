const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const { create, remove, list, read, update } = require("../controllers/brands");

// routes
router.post("/brand", expiryCheck, authCheck, adminCheck, create);
router.get("/brands", expiryCheck, list);
router.delete("/brand/:slug", expiryCheck, authCheck, adminCheck, remove);
router.get("/brand/:slug", expiryCheck, read);
router.put("/brand/:slug", expiryCheck, authCheck, adminCheck, update);

module.exports = router;
