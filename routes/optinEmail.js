const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controller
const {
  create,
  list,
  getjsondata,
  uploadjsondata,
} = require("../controllers/optinEmail");

// routes
router.post("/optinEmailcreate", expiryCheck, create);
router.post("/optinEmailslist", expiryCheck, authCheck, adminCheck, list);
router.get("/getoptinsjson", expiryCheck, authCheck, adminCheck, getjsondata);
router.post(
  "/uploadoptinsjson",
  expiryCheck,
  authCheck,
  adminCheck,
  uploadjsondata
);

module.exports = router;
