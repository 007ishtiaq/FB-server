const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const { create, list } = require("../controllers/optinEmail");

// routes
router.post("/optinEmailcreate", expiryCheck, create);
router.post("/optinEmailslist", expiryCheck, authCheck, adminCheck, list);

module.exports = router;
