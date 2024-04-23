const express = require("express");

const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

const {
  getAllRatings,
  markRead,
  deleteComment,
} = require("../controllers/ratings");

// Admin Get all user ratings
router.get(
  "/admin/allratings",
  expiryCheck,
  authCheck,
  adminCheck,
  getAllRatings
);
// Admin mark comments read
router.put("/admin/commentRead", expiryCheck, authCheck, adminCheck, markRead);
// Admin delete comments
router.put(
  "/admin/deleteComment",
  expiryCheck,
  authCheck,
  adminCheck,
  deleteComment
);

module.exports = router;
