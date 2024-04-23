const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

// controllers
const { upload, remove } = require("../controllers/cloudinary");

router.post("/uploadimages", expiryCheck, authCheck, adminCheck, upload);
router.post("/removeimage", expiryCheck, authCheck, adminCheck, remove);

//for users deposite slip uploading
router.post("/slipupload", expiryCheck, authCheck, upload);

//for users Contact form attachment uploading
router.post("/attachment", expiryCheck, upload);
router.post("/removeattachment", expiryCheck, remove);

module.exports = router;
