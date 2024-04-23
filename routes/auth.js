const express = require("express");

const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// import
const {
  createOrUpdateUser,
  createOrUpdatePhoneUser,
  currentUser,
} = require("../controllers/auth");

router.post(
  "/create-or-update-user",
  expiryCheck,
  authCheck,
  createOrUpdateUser
);
// router.post("/create-or-update-phone-user", expiryCheck, authCheck, createOrUpdatePhoneUser);
router.post("/current-user", expiryCheck, authCheck, currentUser);
router.post("/current-admin", expiryCheck, authCheck, adminCheck, currentUser);

module.exports = router;
