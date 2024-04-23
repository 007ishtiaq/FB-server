const express = require("express");

const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controllers
const {
  submitContact,
  list,
  readform,
  setReplied,
} = require("../controllers/contact");

// routes
router.post("/contact", expiryCheck, submitContact);
router.get("/contactForms", expiryCheck, authCheck, adminCheck, list);
router.get("/contactForm/:id", expiryCheck, authCheck, adminCheck, readform);
router.put(
  "/contactForm/replied",
  expiryCheck,
  authCheck,
  adminCheck,
  setReplied
);

module.exports = router;
