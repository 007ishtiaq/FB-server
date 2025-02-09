const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const {
  create,
  remove,
  list,
  getjsondata,
  uploadjsondata,
} = require("../controllers/colors");

// routes
router.post("/color", expiryCheck, authCheck, adminCheck, create);
router.get("/colors", expiryCheck, list);
router.delete("/color/:slug", expiryCheck, authCheck, adminCheck, remove);
router.get("/getcolorsjson", expiryCheck, authCheck, adminCheck, getjsondata);
router.post(
  "/uploadcolorsjson",
  expiryCheck,
  authCheck,
  adminCheck,
  uploadjsondata
);

module.exports = router;
